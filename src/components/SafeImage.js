import React from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// SafeImage component that handles missing image files gracefully
const SafeImage = ({ 
  source, 
  fallbackIcon, 
  fallbackColor = '#FFFFFF', 
  style, 
  iconSize = 32,
  containerStyle,
  ...props 
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Try to render the image first
  if (!imageError && source) {
    return (
      <View style={containerStyle}>
        <Image
          source={source}
          style={style}
          onError={() => {
            console.log('Image failed to load, showing fallback icon');
            setImageError(true);
          }}
          onLoad={() => setImageLoaded(true)}
          {...props}
        />
        {/* Show fallback while loading if needed */}
        {!imageLoaded && (
          <View style={[style, { position: 'absolute', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons 
              name={fallbackIcon} 
              size={iconSize} 
              color={fallbackColor}
            />
          </View>
        )}
      </View>
    );
  }

  // Fallback to icon
  return (
    <View style={[containerStyle, style, { justifyContent: 'center', alignItems: 'center' }]}>
      <Ionicons 
        name={fallbackIcon} 
        size={iconSize} 
        color={fallbackColor}
      />
    </View>
  );
};

export default SafeImage;