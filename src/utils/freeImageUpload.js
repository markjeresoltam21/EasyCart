// FREE IMAGE UPLOAD SOLUTION - No Firebase Storage needed!
// Using ImgBB API (completely free, no credit card required)

export const uploadImageToImgBB = async (imageUri) => {
  try {
    console.log('🆓 Starting FREE image upload to ImgBB...');
    
    // Convert image to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Convert blob to base64
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(',')[1]; // Remove data:image/jpeg;base64,
        resolve(base64String);
      };
      reader.readAsDataURL(blob);
    });
    
    // Upload to ImgBB (free service)
    const formData = new FormData();
    formData.append('image', base64);
    formData.append('key', '2d1f6b6f8c5e4c8a9d2e1f3b4c5d6e7f'); // Free API key
    
    const uploadResponse = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });
    
    const result = await uploadResponse.json();
    
    if (result.success) {
      console.log('✅ FREE upload successful!');
      return result.data.display_url; // This is your image URL
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('❌ Free upload error:', error);
    throw error;
  }
};

// Alternative: Use Cloudinary (also free)
export const uploadImageToCloudinary = async (imageUri) => {
  try {
    console.log('🆓 Starting FREE upload to Cloudinary...');
    
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    });
    formData.append('upload_preset', 'easycart_free'); // Free preset
    
    const response = await fetch(
      'https://api.cloudinary.com/v1_1/easycart/image/upload',
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    const result = await response.json();
    return result.secure_url;
  } catch (error) {
    console.error('❌ Free upload error:', error);
    throw error;
  }
};