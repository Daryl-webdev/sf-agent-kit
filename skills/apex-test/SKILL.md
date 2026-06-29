---
name: apex-test
description: 'Generate Apex test classes. Use for unit tests, coverage, triggers, controllers. Uses Salesforce DX MCP.'
argument-hint: 'Name or path of the Apex class to generate tests for (e.g., "ServiceInvoiceUploadController")'
---

# Apex Test Class Generator

Focused workflow for generating comprehensive Apex test classes. Uses Salesforce DX MCP for running tests, scanning for antipatterns, and static code analysis.

## When to Use

- Generating a test class for an existing Apex class
- Adding test methods to increase code coverage
- Writing tests for triggers, controllers, batch/queueable/schedulable classes
- Validating test coverage meets deployment requirements (75%+ org, 85%+ recommended)

## Salesforce DX MCP Tools

Use these specific tools from the `@salesforce/mcp` server:

| Tool | Purpose |
|------|---------|
| `run_apex_test` | Execute the generated test class in the org and verify results |
| `scan_apex_class_for_antipatterns` | Analyze the source class for performance issues before writing tests |
| `run_code_analyzer` | Run static analysis on the generated test class for best practices |
| `query_code_analyzer_results` | Review analysis results after running code analyzer |
| `run_soql_query` | Query org metadata to understand object relationships |
| `deploy_metadata` | Deploy the test class to the org |

## Workflow

### Step 1: Analyze the Source Class

1. Read the Apex class to be tested
2. Use `scan_apex_class_for_antipatterns` to identify any issues in the source class
3. Identify:
   - **Class type**: Controller, Service, Trigger Handler, Batch, Queueable, Schedulable, Invocable
   - **Methods to test**: All public/global methods, `@AuraEnabled`, `@InvocableMethod`, `@RemoteAction`
   - **Dependencies**: SOQL queries, DML operations, callouts, other class references
   - **Object relationships**: Parent-child, lookup, junction objects involved
   - **Governor limit risks**: SOQL/DML in loops, large data sets

### Step 2: Plan Test Coverage

For each method, plan:

| Scenario Type | What to Test |
|---------------|--------------|
| **Positive** | Valid inputs, expected happy-path behavior |
| **Negative** | Invalid inputs, null values, empty collections |
| **Bulk** | 200+ records to verify bulkification |
| **Permission** | Different user profiles/permission sets |
| **Exception** | Try/catch paths, custom exception handling |
| **Boundary** | Edge cases, max field lengths, governor limits |

### Step 3: Generate the Test Class

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
        System.assertEquals(expected, actual, 'Descriptive failure message');
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

### Step 4: Apply Conventions

- **Naming**: `[SourceClassName]Test` (e.g., `ServiceInvoiceUploadControllerTest`)
- **Test method naming**: `test[MethodName]_[scenario]` (e.g., `testUploadInvoice_positiveScenario`)
- **One assertion focus per test**: Each test method validates one behavior
- **`@TestSetup`**: Create shared test data once, not in every method
- **`Test.startTest()` / `Test.stopTest()`**: Always wrap the method under test to reset governor limits
- **Descriptive assertions**: `System.assertEquals(expected, actual, 'Should return 3 invoices for active provider')`
- **No hardcoded IDs**: Use `@TestSetup` data or dynamically created records
- **No `SeeAllData=true`**: Never use unless testing against org data (extremely rare)

### Step 5: Handle Special Patterns

#### Callout Tests
```apex
@IsTest
static void testCallout_success() {
    Test.setMock(HttpCalloutMock.class, new MockHttpResponse(200, '{"status":"ok"}'));
    Test.startTest();
    String result = MyService.makeCallout();
    Test.stopTest();
    System.assertEquals('ok', result);
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
    System.assertNotEquals(null, result.CustomField__c);
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
    System.assertNotEquals(null, ct);
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
    System.assert(!results.isEmpty(), 'Should return accounts');
}

@IsTest
static void testGetRecords_throwsOnInvalidInput() {
    Test.startTest();
    try {
        MyController.getAccounts(null);
        System.assert(false, 'Should have thrown AuraHandledException');
    } catch (AuraHandledException e) {
        System.assert(e.getMessage().contains('Invalid'), 'Error message should indicate invalid input');
    }
    Test.stopTest();
}
```

### Step 6: Validate

1. Use `run_code_analyzer` on the generated test class to check for issues
2. Use `deploy_metadata` to deploy the test class to the org
3. Use `run_apex_test` to execute the tests and verify:
   - All tests pass
   - Coverage meets target (85%+ recommended)
   - No governor limit warnings
4. If tests fail, diagnose and fix, then re-run

## Quality Checklist

- [ ] Test class is `@IsTest private`
- [ ] Uses `@TestSetup` for shared data creation
- [ ] Every public/global method has at least one test
- [ ] Positive, negative, and bulk scenarios covered
- [ ] `Test.startTest()` / `Test.stopTest()` wraps method under test
- [ ] All assertions have descriptive failure messages
- [ ] No `SeeAllData=true`
- [ ] No hardcoded record IDs
- [ ] Callouts use `Test.setMock()`
- [ ] Bulk test uses 200+ records
- [ ] No SOQL/DML in loops within test methods
- [ ] Test class compiles and deploys without errors
- [ ] All tests pass in the org
- [ ] Coverage ≥ 85% for the source class

## Common Pitfalls

| Issue | Fix |
|-------|-----|
| Mixed DML error | Use `System.runAs()` with separate user for setup objects |
| SOQL 101 in tests | Use `@TestSetup` and selective queries |
| Async not executing | Ensure `Test.stopTest()` is called after async enqueue |
| Callout error | Add `Test.setMock()` before the callout method |
| Cannot delete test data | Use `@TestSetup` — framework handles cleanup |
| Low coverage | Add tests for catch blocks, conditional branches, and loops |
