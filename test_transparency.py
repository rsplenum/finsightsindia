from PIL import Image
import os

def remove_white_bg(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        # Check if the pixel is near white
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            # Change to transparent
            new_data.append((255, 255, 255, 0))
        else:
            # Keep the original pixel
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

# Just defining the function, we'll test it later if needed.
