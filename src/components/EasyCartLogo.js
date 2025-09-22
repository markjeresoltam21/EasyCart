import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const EasyCartLogo = ({ width = 120, height = 120, color = '#1e3a8a' }) => {
  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={width} height={height} viewBox="0 0 200 200" fill="none">
        {/* Shopping Cart Base */}
        <Path
          d="M20 40 L40 40 L50 80 L160 80 L170 50 L60 50"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Shopping Cart Bottom */}
        <Path
          d="M50 80 L50 120 L150 120 L160 80"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Cart Wheels */}
        <Circle cx="70" cy="140" r="8" fill={color} />
        <Circle cx="130" cy="140" r="8" fill={color} />
        
        {/* Checkmark inside cart */}
        <Path
          d="M80 90 L95 105 L120 80"
          stroke="#10b981"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Cart Handle */}
        <Path
          d="M160 80 L160 60 L180 60 L180 80"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

export default EasyCartLogo;