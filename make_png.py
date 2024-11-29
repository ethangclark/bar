from PIL import Image

# Create a new 9x9 image with an RGBA mode (Red, Green, Blue, Alpha)
image = Image.new("RGBA", (9, 9))

black = (0, 0, 0, 255)
white = (255, 255, 255, 255)
transparent = (0, 0, 0, 0)

# Define the pixel data
pixels = [
    [
        transparent,
        transparent,
        transparent,
        white,
        black,
        white,
        transparent,
        transparent,
        transparent,
    ],
    [
        transparent,
        transparent,
        transparent,
        white,
        black,
        white,
        transparent,
        transparent,
        transparent,
    ],
    [
        transparent,
        transparent,
        transparent,
        white,
        black,
        white,
        transparent,
        transparent,
        transparent,
    ],
    [
        white,
        white,
        white,
        white,
        black,
        white,
        white,
        white,
        white,
    ],
    [
        black,
        black,
        black,
        black,
        black,
        black,
        black,
        black,
        black,
    ],
    [
        white,
        white,
        white,
        white,
        black,
        white,
        white,
        white,
        white,
    ],
    [
        transparent,
        transparent,
        transparent,
        white,
        black,
        white,
        transparent,
        transparent,
        transparent,
    ],
    [
        transparent,
        transparent,
        transparent,
        white,
        black,
        white,
        transparent,
        transparent,
        transparent,
    ],
    [
        transparent,
        transparent,
        transparent,
        white,
        black,
        white,
        transparent,
        transparent,
        transparent,
    ],
]

# Apply the pixel data to the image
for y in range(9):
    for x in range(9):
        image.putpixel((x, y), pixels[y][x])

# Save the image as a PNG file
image.save("public/images/crosshair_8.png")
