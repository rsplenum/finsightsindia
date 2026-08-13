# Paid API Usage & Image Retention

1. **Explicit Permission Required:** You MUST obtain explicit, affirmative permission from the user before executing ANY custom Python script that accesses a paid API (such as `gen_images.py`, `patch_images.py`, or any temporary script you write that uses the `GEMINI_API_KEY`).
2. **Never Overwrite:** Never overwrite an existing generated image.
3. **Never Delete:** Never delete any generated image, even if it is faulty, rejected by the user, or hallucinated. 
4. **Archiving:** If an image needs to be regenerated or replaced, you must either:
   - Move the old image to `src/assets/images/unused_illustrations/` before generating the new one.
   - Generate the new image with a versioned filename (e.g., `filename-v2.jpg`).
