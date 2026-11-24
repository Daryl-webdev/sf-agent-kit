# Apex Test Patterns

Examples are illustrative; apply project naming and headers and add scenarios only where relevant.

## Example test class

Follow this structure:

```apex
@IsTest
private class [ClassName]Test {

    @TestSetup
    static void makeData() {
        // Create all test data here
        // Use Test.loadData() for complex scenarios
    }

    @IsTest
    static void testMethodName_positiveScenario() {
        // Given: setup specific to this test
        // When: invoke the method
        Test.startTest();
        // method call here
        Test.stopTest();
        // Then: assert results
        Assert.areEqual(expected, actual, 'Descriptive failure message');
    }

    @IsTest
    static void testMethodName_negativeScenario() {
        // Test invalid inputs, exceptions
    }

    @IsTest
    static void testMethodName_bulkScenario() {
        // Test with 200+ records
    }
}
```

## Test conventions

- **Naming**: `[SourceClassName]Test` (e.g., `ServiceInvoiceUploadControllerTest`)
- **Test method naming**: `test[MethodName]_[scenario]` (e.g., `testUploadInvoice_positiveScenario`)
- **One assertion focus per test**: Each test method validates one behavior
- **`@TestSetup`**: Create shared test data once, not in every method
- **`Test.startTest()` / `Test.stopTest()`**: Always wrap the method under test to reset governor limits
- **Descriptive assertions**: `Assert.areEqual(expected, actual, 'Should return 3 invoices for active provider')`
- **Modern `Assert` class**: use `Assert.areEqual` / `Assert.isTrue` / `Assert.isNotNull` / `Assert.fail` — not legacy `System.assert*`
- **No hardcoded IDs**: Use `@TestSetup` data or dynamically created records
- **No `SeeAllData=true`**: Never use unless testing against org data (extremely rare)

## Special patterns

#### Callout Tests
```apex
@IsTest
static void testCallout_success() {
    Test.setMock(HttpCalloutMock.class, new MockHttpResponse(200, '{"status":"ok"}'));
    Test.startTest();
    String result = MyService.makeCallout();
    Test.stopTest();
    Assert.areEqual('ok', result, 'Callout should return ok status');
}
```

#### Trigger Tests
```apex
@IsTest
static void testTrigger_beforeInsert() {
    Test.startTest();
    Account acc = new Account(Name = 'Test');
    insert acc;
    Test.stopTest();
    Account result = [SELECT Id, CustomField__c FROM Account WHERE Id = :acc.Id];
    Assert.isNotNull(result.CustomField__c, 'Trigger should populate CustomField__c');
}
```

#### Batch Tests
```apex
@IsTest
static void testBatch_executesSuccessfully() {
    // Create test data
    Test.startTest();
    Database.executeBatch(new MyBatchClass());
    Test.stopTest();
    // Assert batch processed records correctly
}
```

#### Queueable Tests
```apex
@IsTest
static void testQueueable_processesRecords() {
    Test.startTest();
    System.enqueueJob(new MyQueueable(recordIds));
    Test.stopTest();
    // Assert results
}
```

#### Schedulable Tests
```apex
@IsTest
static void testSchedulable_executes() {
    Test.startTest();
    String jobId = System.schedule('Test Job', '0 0 0 1 1 ?', new MySchedulable());
    Test.stopTest();
    CronTrigger ct = [SELECT Id, State FROM CronTrigger WHERE Id = :jobId];
    Assert.isNotNull(ct, 'Job should be scheduled');
}
```

#### AuraEnabled / LWC Controller Tests
```apex
@IsTest
static void testGetRecords_returnsData() {
    // Insert test data in @TestSetup
    Test.startTest();
    List<Account> results = MyController.getAccounts();
    Test.stopTest();
    Assert.isFalse(results.isEmpty(), 'Should return accounts');
}

@IsTest
static void testGetRecords_throwsOnInvalidInput() {
    Test.startTest();
    try {
        MyController.getAccounts(null);
        Assert.fail('Should have thrown AuraHandledException');
    } catch (AuraHandledException e) {
        Assert.isTrue(e.getMessage().contains('Invalid'), 'Error message should indicate invalid input');
    }
    Test.stopTest();
}
```

## Common Pitfalls

| Issue | Fix |
|-------|-----|
| Mixed DML error | Use `System.runAs()` with separate user for setup objects |
| SOQL 101 in tests | Use `@TestSetup` and selective queries |
| Async not executing | Ensure `Test.stopTest()` is called after async enqueue |
| Callout error | Add `Test.setMock()` before the callout method |
| Cannot delete test data | Use `@TestSetup` — framework handles cleanup |
| Low coverage | Add tests for catch blocks, conditional branches, and loops |
