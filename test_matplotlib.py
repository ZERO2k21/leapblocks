#!/usr/bin/env python3
"""
Quick Test Script for Matplotlib Fix
Run this to verify everything works correctly
"""

print("=" * 60)
print("MATPLOTLIB FIX - QUICK TEST")
print("=" * 60)

# Test 1: Check imports
print("\n[Test 1] Checking imports...")
try:
    from datetime import datetime, timedelta
    print("✓ datetime and timedelta imported successfully")
except ImportError as e:
    print(f"✗ Error importing datetime: {e}")

try:
    import math
    print("✓ math imported successfully")
except ImportError as e:
    print(f"✗ Error importing math: {e}")

try:
    import matplotlib.pyplot as plt
    print("✓ matplotlib.pyplot imported successfully")
except ImportError as e:
    print(f"✗ Error importing matplotlib: {e}")
    print("  Solution: Run 'pip install matplotlib'")

# Test 2: Check user input parsing
print("\n[Test 2] Testing input parsing...")
test_input = "1, 2, 3, 4, 5"
try:
    values = [int(val.strip()) for val in test_input.split(',')]
    print(f"✓ Input parsing works: '{test_input}' → {values}")
except Exception as e:
    print(f"✗ Error parsing input: {e}")

# Test 3: Check math operations
print("\n[Test 3] Testing math operations...")
try:
    num = 16
    result = math.sqrt(num)
    print(f"✓ Math operations work: sqrt({num}) = {result}")
except Exception as e:
    print(f"✗ Error in math operations: {e}")

# Test 4: Check matplotlib plot creation
print("\n[Test 4] Testing matplotlib plot creation...")
try:
    x = [1, 2, 3, 4, 5]
    y = [10, 20, 30, 40, 50]
    
    plt.figure(figsize=(8, 6))
    plt.plot(x, y, marker='o', color='red')
    plt.title("Test Graph")
    plt.xlabel("X-axis")
    plt.ylabel("Y-axis")
    
    print("✓ Plot created successfully")
    print("  Note: Graph window will open. Close it to continue.")
    
    plt.show()
    
except Exception as e:
    print(f"✗ Error creating plot: {e}")

print("\n" + "=" * 60)
print("TEST COMPLETED!")
print("=" * 60)
print("\nIf all tests passed (✓), your setup is working correctly!")
print("You can now run: python new_file_enhanced.py")
