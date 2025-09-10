# 🤖 Automation Builder - Hướng Dẫn Sử Dụng & Testing

## 📋 Tổng Quan

Automation Builder cho phép tạo automation scripts bằng visual nodes, tương tự Selenium IDE nhưng sử dụng Puppeteer.

## 🎯 Các Loại Node

### 🔵 Actions (Hành động cơ bản)
1. **Go To URL** - Điều hướng đến trang web
2. **Type Text** - Gõ text vào input field  
3. **Click Element** - Click vào element
4. **Multi Type** - Gõ nhiều field cùng lúc

### 🟠 Control Flow (Điều khiển luồng)
1. **If Condition** - Điều kiện rẽ nhánh
2. **Else** - Nhánh ngược lại
3. **Wait For Element** - Chờ element xuất hiện
4. **Sleep** - Chờ theo thời gian
5. **For Loop** - Lặp theo số lần
6. **While Loop** - Lặp theo điều kiện

### 🟢 Data (Xử lý dữ liệu)  
1. **Variable** - Lưu trữ biến
2. **Extract Data** - Trích xuất dữ liệu từ page

## 🚀 Cách Sử Dụng

### Bước 1: Tạo Flow
1. Kéo thả nodes từ sidebar vào canvas
2. Kết nối các nodes bằng cách kéo từ handle phải sang handle trái
3. Click vào node để cấu hình trong panel bên phải

### Bước 2: Cấu Hình Node
- **XPath**: Sử dụng Developer Tools để copy XPath
- **Text**: Nội dung cần gõ hoặc kiểm tra
- **Timeout**: Thời gian chờ (milliseconds)

### Bước 3: Generate Code
1. Nhấn "Generate & Copy Code"
2. Code sẽ được copy vào clipboard
3. Paste vào script runner để chạy

## 🧪 Testing & Debug

### Test Flow Đơn Giản
```
1. Go To URL: https://www.google.com
2. Type Text: xpath="//textarea[@name='q']", text="Hello World"
3. Click: xpath="//input[@name='btnK']"
```

### Test Conditional Logic
```
1. Go To URL: https://example.com
2. If Condition: element_exists, xpath="//button[@id='login']"
   3. Click: xpath="//button[@id='login']"
4. Else:
   5. Type: xpath="//input[@name='search']", text="alternative"
```

### Test Loop
```
1. Go To URL: https://example.com
2. For Loop: start=1, end=5, step=1
   3. Click: xpath="//button[@class='next']"
   4. Sleep: 1000ms
```

### Test Data Extraction
```
1. Go To URL: https://example.com
2. Extract: xpath="//h1", variableName="title", type="text"
3. Variable: operation="get", name="title"
```

## 🔧 Common XPath Patterns

### Input Fields
- `//input[@name='username']`
- `//input[@type='password']`
- `//textarea[@placeholder='Message']`

### Buttons
- `//button[@id='submit']`
- `//input[@type='submit']`
- `//button[contains(text(),'Login')]`

### Links
- `//a[@href='/login']`
- `//a[contains(text(),'Click here')]`

### Dynamic Elements
- `//div[@class='item'][1]` (first item)
- `//td[contains(@class,'data-cell')]`
- `//*[contains(text(),'Dynamic Text')]`

## 🐛 Debugging Tips

### 1. Element Not Found
- ✅ Kiểm tra XPath trong Developer Tools
- ✅ Thêm Wait node trước khi interact
- ✅ Kiểm tra element có trong iframe không

### 2. Timing Issues
- ✅ Sử dụng Wait For Element thay vì Sleep
- ✅ Tăng timeout nếu page load chậm
- ✅ Thêm Sleep sau click nếu có animation

### 3. Dynamic Content
- ✅ Sử dụng contains() trong XPath
- ✅ Sử dụng While loop để chờ content load
- ✅ Extract data để kiểm tra state

## 📊 Best Practices

### Flow Structure
1. **Start**: Go To URL
2. **Setup**: Wait for key elements
3. **Actions**: Type, Click, Extract
4. **Validation**: If/Else for error handling
5. **Cleanup**: Final actions

### Error Handling
```
1. Go To URL
2. Wait For Element: xpath="//body", timeout=10000
3. If Condition: element_exists, xpath="//div[@class='error']"
   4. Extract: error message
   5. Variable: log error
6. Else:
   7. Continue normal flow
```

### Reusable Patterns
- Tạo template flows cho common tasks
- Sử dụng MultiType cho forms
- Group related actions với comments

## 🎮 Live Testing

### 1. Browser Console
```javascript
// Test XPath
$x("//input[@name='q']")

// Test element existence  
document.querySelector("button#submit") !== null
```

### 2. Manual Verification
- Chạy từng step một trong browser
- Kiểm tra network requests trong DevTools
- Verify DOM changes sau mỗi action

### 3. Script Testing
- Chạy generated code trong isolated test
- Add console.log để debug
- Screenshot khi có lỗi

## 🔄 Common Flow Patterns

### Login Flow
```
Go To → Wait (login form) → Type (username) → Type (password) → Click (submit) → Wait (dashboard)
```

### Search & Extract Flow  
```
Go To → Type (search) → Click (search button) → Wait (results) → Extract (data) → Variable (store)
```

### Pagination Flow
```
Go To → For Loop (pages) → Extract (current page data) → Click (next) → Sleep
```

### Form Filling Flow
```
Go To → Wait (form) → MultiType (all fields) → Click (submit) → If (success) → Extract (confirmation)
```

## 🎯 Performance Tips

- Minimize Sleep usage, prefer Wait
- Use efficient XPaths (avoid //)
- Batch similar actions với MultiType
- Set appropriate timeouts
- Test với different network speeds

## 📞 Troubleshooting

**Q: Node không execute?**
A: Kiểm tra connections giữa các nodes

**Q: XPath không work?**  
A: Copy Full XPath từ DevTools, rồi simplify

**Q: Timing issues?**
A: Thêm Wait nodes và increase timeouts

**Q: Code không generate?**
A: Kiểm tra tất cả nodes đã configured

---

🎉 **Happy Automating!** Tạo flows phức tạp và chia sẻ với team!