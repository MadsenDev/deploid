# Why `./shipwright` vs `shipwright`?

## 🔍 **The Difference Explained**

### **`./shipwright` (Relative Path)**
- **What it means**: "Run the file in current directory"
- **How shell finds it**: Looks in current directory
- **Always works**: If file exists in current directory
- **Example**: `./shipwright --help`

### **`shipwright` (Command Name)**
- **What it means**: "Find this command in my PATH"
- **How shell finds it**: Searches directories in `$PATH`
- **Requires setup**: Command must be in PATH
- **Example**: `shipwright --help`

## 🛠️ **How We Fixed It**

### **The Solution: Symlink + PATH**

1. **Create Symlink**:
   ```bash
   ln -sf /path/to/shipwright ~/.local/bin/shipwright
   ```

2. **Add to PATH**:
   ```bash
   export PATH=$PATH:~/.local/bin
   ```

3. **Now `shipwright` works anywhere!**

### **What the Setup Script Does**

```bash
./install-global.sh
```

**Automatically**:
1. ✅ Builds all packages
2. ✅ Creates `~/.local/bin/shipwright` symlink
3. ✅ Adds `~/.local/bin` to your `~/.bashrc`
4. ✅ You can use `shipwright` anywhere!

## 🎯 **Result**

### **Before Setup**:
```bash
./shipwright --help          # ✅ Works (relative path)
shipwright --help            # ❌ Command not found
```

### **After Setup**:
```bash
./shipwright --help          # ✅ Works (relative path)
shipwright --help            # ✅ Works (global command)
```

## 🔧 **Technical Details**

### **Shell Command Lookup Order**:
1. **Built-in commands** (cd, ls, etc.)
2. **PATH directories**:
   - `/usr/bin/`
   - `/usr/local/bin/`
   - `~/.local/bin/` ← Our symlink goes here
   - etc.

### **Why `./` Works**:
- `./` = "current directory"
- Shell looks in current directory first
- No PATH search needed

### **Why `shipwright` Needs Setup**:
- Shell searches PATH directories
- Must be in one of those directories
- Symlink puts it in `~/.local/bin/`

## 🚀 **Usage Examples**

### **Development (Current Directory)**:
```bash
cd /path/to/shipwright
./shipwright init
./shipwright assets
```

### **Global (Any Directory)**:
```bash
cd /path/to/my-project
shipwright init
shipwright assets
```

### **Both Work After Setup**:
```bash
# Either works:
./shipwright --help
shipwright --help
```

## 📚 **Summary**

- **`./shipwright`**: Relative path, works in current directory
- **`shipwright`**: Global command, works anywhere (after setup)
- **Setup script**: Automatically makes `shipwright` work globally
- **Result**: Clean `shipwright` command everywhere! 🎉
