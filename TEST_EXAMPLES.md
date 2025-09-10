# 🧪 Automation Test Examples

## 📝 Test Flows Cho Từng Loại Node

### 1. 🔵 Actions Nodes Test

#### Test 1: Basic Google Search
```
Nodes: 
1. Go To URL: "https://www.google.com"
2. Wait For Element: xpath="//textarea[@name='q']", timeout=5000
3. Type Text: xpath="//textarea[@name='q']", text="Puppeteer automation"
4. Click Element: xpath="(//input[@name='btnK'])[1]"
5. Wait For Element: xpath="//div[@id='search']", timeout=10000

Expected: Trang kết quả tìm kiếm hiển thị
```

#### Test 2: Multi Type Form
```
Nodes:
1. Go To URL: "https://httpbin.org/forms/post"  
2. Wait For Element: xpath="//form", timeout=5000
3. Multi Type:
   - Field 1: xpath="//input[@name='custname']", text="John Doe", label="Customer Name"
   - Field 2: xpath="//input[@name='custtel']", text="123456789", label="Phone"
   - Field 3: xpath="//input[@name='custemail']", text="john@test.com", label="Email"
4. Click Element: xpath="//input[@type='submit']"

Expected: Form submitted successfully
```

### 2. 🟠 Control Flow Nodes Test

#### Test 3: If/Else Logic
```
Nodes:
1. Go To URL: "https://www.w3schools.com/html/tryit.asp?filename=tryhtml_button_disabled"
2. Wait For Element: xpath="//iframe[@id='iframeResult']", timeout=5000
3. If Condition: element_exists, xpath="//button[@disabled]"
   4. Extract Data: xpath="//button", variable="buttonText"
   5. Variable: operation="get", name="buttonText"
6. Else:
   7. Click Element: xpath="//button"
   8. Sleep: 1000

Expected: Phát hiện disabled button và extract text
```

#### Test 4: Wait & Sleep
```
Nodes:
1. Go To URL: "https://the-internet.herokuapp.com/dynamic_loading/1"
2. Click Element: xpath="//button"
3. Wait For Element: xpath="//div[@id='finish']", timeout=10000
4. Extract Data: xpath="//div[@id='finish']/h4", variable="result"
5. Sleep: 2000
6. If Condition: text_contains, value="Hello World!"
   7. Variable: operation="set", name="status", value="success"

Expected: Chờ element load và verify text
```

#### Test 5: For Loop Pagination
```
Nodes:
1. Go To URL: "https://scrapethissite.com/pages/forms/"
2. For Loop: start=1, end=3, step=1
   3. Extract Data: xpath="//table//tr[2]/td[1]", variable="team1"
   4. Click Element: xpath="//a[@aria-label='Next']"
   5. Sleep: 2000

Expected: Loop through 3 pages và extract data
```

#### Test 6: While Loop Dynamic Content
```
Nodes:
1. Go To URL: "https://infinite-scroll-example.com"
2. While Loop: condition="element_not_exists", xpath="//div[@class='load-complete']"
   3. Extract Data: xpath="//div[@class='item']:last-child", variable="lastItem"
   4. Click Element: xpath="//button[@class='load-more']"
   5. Sleep: 1000

Expected: Load content until no more items
```

### 3. 🟢 Data Nodes Test

#### Test 7: Variable Operations
```
Nodes:
1. Variable: operation="set", name="baseURL", value="https://httpbin.org"
2. Variable: operation="get", name="baseURL"
3. Go To URL: {{baseURL}}/get
4. Extract Data: xpath="//pre", variable="response"
5. Variable: operation="set", name="timestamp", value="{{currentTime}}"

Expected: Set và get variables thành công
```

#### Test 8: Data Extraction
```
Nodes:
1. Go To URL: "https://quotes.toscrape.com"
2. Extract Data: xpath="//span[@class='text']", variable="quote1", type="text"
3. Extract Data: xpath="//small[@class='author']", variable="author1", type="text"
4. Extract Data: xpath="//a[@href='/tag/']", variable="tagLink", type="attribute", attribute="href"
5. Variable: operation="set", name="data", value="{{quote1}} - {{author1}}"

Expected: Extract text và attributes thành công
```

## 🎯 Complex Flow Tests

### Test 9: E-commerce Complete Flow
```
Nodes:
1. Go To URL: "https://demo-store.com"
2. Wait For Element: xpath="//input[@name='search']", timeout=5000
3. Type Text: xpath="//input[@name='search']", text="laptop"
4. Click Element: xpath="//button[@type='submit']"
5. Wait For Element: xpath="//div[@class='products']", timeout=10000
6. If Condition: element_exists, xpath="//div[@class='product-item']"
   7. Click Element: xpath="(//div[@class='product-item'])[1]"
   8. Wait For Element: xpath="//button[@class='add-to-cart']", timeout=5000
   9. Click Element: xpath="//button[@class='add-to-cart']"
   10. Extract Data: xpath="//span[@class='price']", variable="price"
11. Else:
   12. Variable: operation="set", name="error", value="No products found"

Expected: Complete shopping flow với error handling
```

### Test 10: Login & Dashboard Navigation
```
Nodes:
1. Go To URL: "https://demo-app.com/login"
2. Multi Type:
   - Field 1: xpath="//input[@name='username']", text="testuser", label="Username"  
   - Field 2: xpath="//input[@name='password']", text="password123", label="Password"
3. Click Element: xpath="//button[@type='submit']"
4. Wait For Element: xpath="//div[@class='dashboard']", timeout=10000
5. If Condition: page_title_is, value="Dashboard"
   6. For Loop: start=1, end=5, step=1
      7. Click Element: xpath="//nav//a[{loopIndex}]"
      8. Extract Data: xpath="//h1", variable="pageTitle{loopIndex}"
      9. Sleep: 1000
10. Else:
   11. Extract Data: xpath="//div[@class='error']", variable="loginError"

Expected: Login và navigate through dashboard pages
```

## 🔧 Debug Test Cases

### Test 11: Timing Issues Debug
```
Nodes:
1. Go To URL: "https://slow-loading-site.com"
2. Sleep: 3000  # Too long - should use Wait instead
3. Wait For Element: xpath="//div[@class='content']", timeout=15000
4. If Condition: element_exists, xpath="//div[@class='loading']"
   5. While Loop: condition="element_exists", xpath="//div[@class='loading']"
      6. Sleep: 500
7. Extract Data: xpath="//div[@class='content']", variable="content"

Expected: Handle slow loading gracefully
```

### Test 12: XPath Issues Debug  
```
Nodes:
1. Go To URL: "https://dynamic-content.com"
2. Wait For Element: xpath="//div[@id='container']", timeout=5000
3. If Condition: element_exists, xpath="//div[contains(@class,'dynamic-item')]"
   4. For Loop: start=1, end=10, step=1
      5. Extract Data: xpath="//div[contains(@class,'item')][{loopIndex}]//span", variable="item{loopIndex}"
      6. If Condition: element_not_exists, xpath="//div[contains(@class,'item')][{loopIndex+1}]"
         7. Break  # End loop if no more items

Expected: Handle dynamic content với flexible XPath
```

## 🎮 Manual Testing Checklist

### ✅ UI Testing
- [ ] Sidebar categories expand/collapse
- [ ] Node dragging works smoothly
- [ ] Node connections create properly
- [ ] Inspector shows correct configuration
- [ ] Code generation produces valid output

### ✅ Functionality Testing  
- [ ] All node types can be created
- [ ] Configuration saves correctly
- [ ] Complex flows execute in order
- [ ] Error handling works properly
- [ ] Variables persist across nodes

### ✅ Code Generation Testing
- [ ] Valid JavaScript syntax
- [ ] Proper async/await usage  
- [ ] Correct XPath handling
- [ ] Loop structures work
- [ ] Conditional blocks close properly

### ✅ Performance Testing
- [ ] Large flows (50+ nodes) handle well
- [ ] Complex loops don't freeze UI
- [ ] Memory usage reasonable
- [ ] Code generation is fast

## 🚨 Common Issues & Solutions

### Issue 1: Element Not Found
```javascript
// Generated Code Debug
console.log("Looking for element:", xpath);
const elements = await page.$$(xpath);
console.log("Found elements:", elements.length);
```

### Issue 2: Timing Problems
```javascript
// Add explicit waits
await page.waitForSelector(selector, { timeout: 30000 });
await page.waitForFunction(() => document.readyState === 'complete');
```

### Issue 3: Variable Scope
```javascript
// Ensure variables are in proper scope
const variables = {};
// Use variables.variableName instead of global vars
```

## 📊 Performance Benchmarks

### Target Metrics:
- **Node Creation**: < 100ms per node
- **Flow Execution**: < 5s for 20 nodes  
- **Code Generation**: < 1s for complex flows
- **Memory Usage**: < 100MB for 100 nodes

---

🎯 **Testing Guide Complete!** Use these examples để verify mọi functionality works correctly.