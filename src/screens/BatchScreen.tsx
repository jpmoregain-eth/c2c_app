import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Image, Alert } from 'react-native';
import { Text, Button, ActivityIndicator, Card, Avatar } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { launchImageLibrary } from 'react-native-image-picker';
import { extractContactFromImage } from '../services/aiService';
import { useContacts } from '../services/ContactContext';

type BatchScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Batch'>;
};

interface ProcessingItem {
  id: string;
  uri: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  name?: string;
  error?: string;
}

export default function BatchScreen({ navigation }: BatchScreenProps) {
  const { addContact } = useContacts();
  const [items, setItems] = useState<ProcessingItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const pickImages = useCallback(() => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 1,
        selectionLimit: 0,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.error('ImagePicker Error:', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const newItems: ProcessingItem[] = response.assets.map((asset, index) => ({
            id: `item_${Date.now()}_${index}`,
            uri: asset.uri || '',
            status: 'pending',
          }));
          setItems(newItems);
        }
      }
    );
  }, []);

  const processWithTimeout = async (uri: string, timeoutMs: number = 30000, retries: number = 2): Promise<any> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        );
        
        const extractPromise = extractContactFromImage(uri);
        const result = await Promise.race([extractPromise, timeoutPromise]);
        return result;
      } catch (error) {
        console.log(`Attempt ${attempt + 1} failed:`, error);
        if (attempt < retries) {
          console.log(`Retrying in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          throw error;
        }
      }
    }
  };

  const processBatch = useCallback(async () => {
    if (items.length === 0) return;
    
    setIsProcessing(true);
    
    for (let i = 0; i < items.length; i++) {
      setCurrentIndex(i);
      
      setItems(prev => prev.map((item, idx) => 
        idx === i ? { ...item, status: 'processing' } : item
      ));
      
      try {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const extracted = await processWithTimeout(items[i].uri, 30000, 2);
        
        await addContact({
          name: extracted.name || 'Unknown',
          title: extracted.title || '',
          company: extracted.company || '',
          phoneOffice: extracted.phoneOffice || '',
          phoneMobile: extracted.phoneMobile || '',
          phoneFax: extracted.phoneFax || '',
          email: extracted.email || '',
          address: extracted.address || '',
          country: extracted.country || '',
          imageUri: items[i].uri,
        });
        
        setItems(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'done', name: extracted.name || 'Unknown' } : item
        ));
        
      } catch (error) {
        console.error(`Failed to process item ${i} after retries:`, error);
        const errorMsg = error instanceof Error && error.message === 'Timeout' 
          ? 'Timeout - skipped' 
          : 'Extraction failed';
        setItems(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'error', error: errorMsg } : item
        ));
        continue;
      }
    }
    
    setIsProcessing(false);
    Alert.alert(
      'Batch Complete',
      `Processed ${items.length} cards. Check Contacts screen for results.`,
      [{ text: 'OK', onPress: () => navigation.navigate('Contacts') }]
    );
  }, [items, addContact, navigation]);

  const clearAll = useCallback(() => {
    setItems([]);
    setCurrentIndex(0);
  }, []);

  const getStatusIcon = (status: ProcessingItem['status']) => {
    switch (status) {
      case 'pending': return 'clock-outline';
      case 'processing': return 'loading';
      case 'done': return 'check-circle';
      case 'error': return 'alert-circle';
    }
  };

  const getStatusColor = (status: ProcessingItem['status']) => {
    switch (status) {
      case 'pending': return '#B2BEC3';
      case 'processing': return '#6366f1';
      case 'done': return '#10B981';
      case 'error': return '#E74C3C';
    }
  };

  const renderItem = useCallback(({ item, index }: { item: ProcessingItem; index: number }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Image source={{ uri: item.uri }} style={styles.thumbnail} />
        <View style={styles.infoContainer}>
          <Text style={styles.statusText}>
            Card {index + 1}
          </Text>
          {item.name && <Text style={styles.nameText}>{item.name}</Text>}
          {item.error && <Text style={styles.errorText}>{item.error}</Text>}
        </View>
        <Avatar.Icon 
          size={36} 
          icon={getStatusIcon(item.status)} 
          style={{ backgroundColor: getStatusColor(item.status) }}
        />
      </Card.Content>
    </Card>
  ), []);

  const doneCount = items.filter(i => i.status === 'done').length;
  const errorCount = items.filter(i => i.status === 'error').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar.Icon size={60} icon="image-multiple" style={styles.headerIcon} />
        <Text style={styles.title}>Batch Processing</Text>
        <Text style={styles.subtitle}>
          {items.length > 0 
            ? `${doneCount} done, ${errorCount} errors, ${items.length - doneCount - errorCount} pending`
            : 'Select multiple business cards to process'
          }
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.centerContent}>
          <Button 
            mode="contained" 
            onPress={pickImages}
            style={styles.selectButton}
            icon="image"
            buttonColor="#6366f1"
          >
            Select Multiple Cards
          </Button>
          <Text style={styles.hint}>
            You can select multiple images from your gallery
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
          
          <View style={styles.buttonContainer}>
            {!isProcessing ? (
              <>
                <Button
                  mode="contained"
                  onPress={processBatch}
                  style={styles.actionButton}
                  icon="play"
                  buttonColor="#6366f1"
                >
                  Start Processing ({items.length} cards)
                </Button>
                <Button
                  mode="outlined"
                  onPress={pickImages}
                  style={styles.actionButton}
                  icon="plus"
                >
                  Add More
                </Button>
                <Button
                  mode="text"
                  onPress={clearAll}
                  style={styles.actionButton}
                  textColor="#E74C3C"
                  icon="delete"
                >
                  Clear All
                </Button>
              </>
            ) : (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color="#6366f1" />
                <Text style={styles.processingText}>
                  Processing card {currentIndex + 1} of {items.length}...
                </Text>
              </View>
            )}
          </View>
        </>
      )}
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
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectButton: {
    width: '80%',
    paddingVertical: 8,
    borderRadius: 12,
  },
  hint: {
    marginTop: 16,
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  nameText: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 2,
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginTop: 2,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  actionButton: {
    marginBottom: 8,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6366f1',
  },
});
