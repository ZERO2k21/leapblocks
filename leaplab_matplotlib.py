# LeapLab Compatible - Matplotlib Graph
# Works in browser-based Python (Skulpt)

print("=== Matplotlib Line Graph Demo ===")
print()

# Import matplotlib
import matplotlib.pyplot as plt

# Since input() doesn't work well in LeapLab,
# we'll use predefined values
# You can change these values directly in the code

print("Using predefined values:")
x = [1, 2, 3, 4, 5]
y = [10, 20, 30, 40, 50]

print(f"X values: {x}")
print(f"Y values: {y}")
print()

# Create the plot
plt.plot(x, y, marker='o', color='red')
plt.title("Line Graph Example")
plt.xlabel("X-axis")
plt.ylabel("Y-axis")
plt.grid(True)

print("Displaying graph...")
plt.show()

print()
print("Graph displayed successfully!")
print()
print("=" * 50)
print("To change values, edit the x and y lists in the code:")
print("  x = [1, 2, 3, 4, 5]  # Change these numbers")
print("  y = [10, 20, 30, 40, 50]  # Change these numbers")
print("=" * 50)
