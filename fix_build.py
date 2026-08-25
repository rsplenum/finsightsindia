import subprocess
import re
import os
import shutil

while True:
    print("Running build...")
    result = subprocess.run(["npm", "run", "build"], capture_output=True, text=True)
    if result.returncode == 0:
        print("Build succeeded!")
        break
    
    missing_images = set(re.findall(r"Could not resolve '(.*?)'", result.stderr))
    missing_images.update(re.findall(r"Could not resolve '(.*?)'", result.stdout))
    
    if not missing_images:
        print("Build failed for another reason:")
        print(result.stdout)
        print(result.stderr)
        break
        
    for img in missing_images:
        if img.endswith('.jpg') or img.endswith('.png') or img.endswith('.svg') or img.endswith('.jpeg'):
            # The path is relative to the mdx file, but we can just extract the filename and search for it, or put it in src/assets/images/
            filename = img.split('/')[-1]
            target = os.path.join("src/assets/images", filename)
            print(f"Creating dummy for {target}")
            shutil.copy("src/assets/images/og-default.jpg", target)
        else:
            print(f"Unknown missing module: {img}")
            
print("Done.")
