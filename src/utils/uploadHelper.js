import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebaseConfig';

export const uploadImageToStorage = async (imageUri, folderPath, filename) => {
  try {
    console.log('🚀 Starting image upload...');
    console.log('📍 Image URI:', imageUri);
    console.log('📁 Folder path:', folderPath);
    console.log('📄 Filename:', filename);

    // Validate inputs
    if (!imageUri) {
      throw new Error('Image URI is required');
    }
    if (!folderPath) {
      throw new Error('Folder path is required');
    }
    if (!filename) {
      throw new Error('Filename is required');
    }

    // Convert image to blob
    console.log('⬇️ Fetching image...');
    const response = await fetch(imageUri);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('✅ Blob created successfully');
    console.log('📏 Blob size:', blob.size, 'bytes');
    console.log('🎯 Blob type:', blob.type);

    // Create storage reference
    const fullPath = `${folderPath}/${filename}`;
    const imageRef = ref(storage, fullPath);
    console.log('🔗 Storage reference created:', fullPath);

    // Upload image with metadata
    const metadata = {
      contentType: blob.type || 'image/jpeg',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalUri: imageUri,
      }
    };

    console.log('📤 Starting upload with metadata:', metadata);
    console.log('🔒 Storage instance:', storage ? 'Available' : 'Missing');
    
    // Test storage access first
    try {
      await uploadBytes(imageRef, blob, metadata);
      console.log('✅ Upload completed successfully');
    } catch (uploadError) {
      console.error('❌ Upload failed:', {
        message: uploadError.message,
        code: uploadError.code,
        name: uploadError.name
      });
      throw uploadError;
    }

    // Get download URL
    console.log('🔗 Getting download URL...');
    const downloadURL = await getDownloadURL(imageRef);
    console.log('✅ Download URL obtained:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('💥 Upload error details:', {
      message: error.message,
      code: error.code,
      serverResponse: error.serverResponse,
      customData: error.customData,
      stack: error.stack
    });
    throw error;
  }
};

export const uploadProfilePicture = async (imageUri, userId) => {
  const filename = `profile_${userId}_${Date.now()}.jpg`;
  return await uploadImageToStorage(imageUri, 'profile-pictures', filename);
};

export const uploadProductImage = async (imageUri, productId) => {
  const filename = `product_${productId}_${Date.now()}.jpg`;
  return await uploadImageToStorage(imageUri, 'product-images', filename);
};