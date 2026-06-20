import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, Avatar } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { launchImageLibrary } from 'react-native-image-picker';

type CameraScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Camera'>;
};

export default function CameraScreen({ navigation }: CameraScreenProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImage = useCallback(() => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 1,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.error('ImagePicker Error:', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          console.log('Image selected:', asset.uri);
          setSelectedImage(asset.uri || null);
        }
      }
    );
  }, []);

  const processImage = useCallback(() => {
    if (selectedImage) {
      navigation.navigate('Processing', { imageUri: selectedImage });
    }
  }, [selectedImage, navigation]);

  const retakePhoto = useCallback(() => {
    setSelectedImage(null);
  }, []);

  if (selectedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.preview} />
        </View>
        <View style={styles.buttonContainer}>
          <Button 
            mode="outlined" 
            onPress={retakePhoto} 
            style={styles.button}
            icon="refresh"
          >
            Choose Another
          </Button>
          <Button
            mode="contained"
            onPress={processImage}
            style={styles.button}
            icon="check"
            buttonColor="#6366f1"
          >
            Process Card
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar.Icon size={80} icon="card-account-details" style={styles.headerIcon} />
        <Text style={styles.title}>Card2Contact</Text>
        <Text style={styles.subtitle}>Select a business card photo from your gallery</Text>
      </View>
      
      <View style={styles.content}>
        <Button 
          mode="contained" 
          onPress={pickImage}
          style={styles.uploadButton}
          icon="image"
          buttonColor="#6366f1"
          contentStyle={styles.buttonContent}
        >
          Choose from Gallery
        </Button>
        
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips for best results:</Text>
          <Text style={styles.tip}>• Make sure the card is well-lit</Text>
          <Text style={styles.tip}>• Keep the card in focus</Text>
          <Text style={styles.tip}>• Avoid glare and shadows</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 40,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  uploadButton: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 12,
  },
  buttonContent: {
    height: 56,
  },
  tipsContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 12,
  },
  tip: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 8,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});
