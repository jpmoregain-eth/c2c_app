import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Avatar } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useContacts } from '../services/ContactContext';
import { extractContactFromImage } from '../services/aiService';

type ProcessingScreenProps = NativeStackScreenProps<RootStackParamList, 'Processing'>;

export default function ProcessingScreen({ route, navigation }: ProcessingScreenProps) {
  const { imageUri } = route.params;
  const { addContact } = useContacts();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Preparing image...');
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    phoneOffice: '',
    phoneMobile: '',
    phoneFax: '',
    email: '',
    address: '',
    country: '',
  });

  useEffect(() => {
    extractContactInfo();
  }, []);

  const extractContactInfo = useCallback(async () => {
    try {
      setLoading(true);
      setStatusMessage('Reading business card image...');
      
      setStatusMessage('Sending to AI for analysis...');
      const extracted = await extractContactFromImage(imageUri);
      
      setStatusMessage('Processing results...');
      setFormData({
        name: extracted.name || '',
        title: extracted.title || '',
        company: extracted.company || '',
        phoneOffice: extracted.phoneOffice || '',
        phoneMobile: extracted.phoneMobile || '',
        phoneFax: extracted.phoneFax || '',
        email: extracted.email || '',
        address: extracted.address || '',
        country: extracted.country || '',
      });
      
      setStatusMessage('Done! Review the info below.');
    } catch (error) {
      console.error('Extraction error:', error);
      setStatusMessage('Extraction failed. Please enter details manually.');
      Alert.alert(
        'Extraction Failed',
        'Could not read the business card. You can enter the info manually below.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, [imageUri]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      await addContact({
        ...formData,
        imageUri,
      });
      Alert.alert('Success', 'Contact saved!', [
        { text: 'OK', onPress: () => navigation.navigate('Contacts') },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  }, [formData, imageUri, addContact, navigation]);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>{statusMessage}</Text>
        <Text style={styles.subText}>This may take a few seconds</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.cardImage} />
      </View>

      <View style={styles.formContainer}>
        <View style={styles.headerRow}>
          <Avatar.Icon size={40} icon="card-text" style={styles.formIcon} />
          <View>
            <Text style={styles.title}>Review & Edit</Text>
            <Text style={styles.subtitle}>Make sure the info is correct</Text>
          </View>
        </View>

        <TextInput
          label="Name *"
          value={formData.name}
          onChangeText={(text) => updateField('name', text)}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="account" />}
        />

        <TextInput
          label="Title"
          value={formData.title}
          onChangeText={(text) => updateField('title', text)}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="badge-account" />}
        />

        <TextInput
          label="Company"
          value={formData.company}
          onChangeText={(text) => updateField('company', text)}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="office-building" />}
        />

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>Contact Numbers</Text>
        </View>

        <TextInput
          label="Office Phone"
          value={formData.phoneOffice}
          onChangeText={(text) => updateField('phoneOffice', text)}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
          left={<TextInput.Icon icon="phone" />}
        />

        <TextInput
          label="Mobile Phone"
          value={formData.phoneMobile}
          onChangeText={(text) => updateField('phoneMobile', text)}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
          left={<TextInput.Icon icon="cellphone" />}
        />

        <TextInput
          label="Fax"
          value={formData.phoneFax}
          onChangeText={(text) => updateField('phoneFax', text)}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
          left={<TextInput.Icon icon="fax" />}
        />

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>Other Details</Text>
        </View>

        <TextInput
          label="Email"
          value={formData.email}
          onChangeText={(text) => updateField('email', text)}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          left={<TextInput.Icon icon="email" />}
        />

        <TextInput
          label="Country"
          value={formData.country}
          onChangeText={(text) => updateField('country', text)}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="earth" />}
        />

        <TextInput
          label="Address"
          value={formData.address}
          onChangeText={(text) => updateField('address', text)}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
          left={<TextInput.Icon icon="map-marker" />}
        />

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving || !formData.name}
          style={styles.saveButton}
          buttonColor="#6366f1"
          icon="content-save"
        >
          Save Contact
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          icon="close"
        >
          Cancel
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2D3436',
    textAlign: 'center',
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
  },
  imageContainer: {
    backgroundColor: '#000',
    padding: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    borderRadius: 12,
  },
  formContainer: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  formIcon: {
    backgroundColor: '#6366f1',
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  subtitle: {
    fontSize: 14,
    color: '#636E72',
  },
  sectionDivider: {
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 8,
    paddingVertical: 8,
  },
  cancelButton: {
    marginBottom: 20,
  },
});
