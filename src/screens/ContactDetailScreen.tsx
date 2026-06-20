import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Avatar, Card } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useContacts } from '../services/ContactContext';

type ContactDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ContactDetail'>;

export default function ContactDetailScreen({ route, navigation }: ContactDetailScreenProps) {
  const { contactId } = route.params;
  const { getContactById, updateContact, deleteContact } = useContacts();
  const contact = getContactById(contactId);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    title: contact?.title || '',
    company: contact?.company || '',
    phoneOffice: contact?.phoneOffice || '',
    phoneMobile: contact?.phoneMobile || '',
    phoneFax: contact?.phoneFax || '',
    email: contact?.email || '',
    address: contact?.address || '',
    country: contact?.country || '',
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = useCallback(async () => {
    try {
      await updateContact(contactId, formData);
      setIsEditing(false);
      Alert.alert('Success', 'Contact updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update contact');
    }
  }, [contactId, formData, updateContact]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact?.name || 'this contact'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteContact(contactId);
            navigation.goBack();
          },
        },
      ]
    );
  }, [contactId, contact, deleteContact, navigation]);

  if (!contact) {
    return (
      <View style={styles.centered}>
        <Text>Contact not found</Text>
      </View>
    );
  }

  const renderField = (label: string, value: string, key: keyof typeof formData, icon: string) => {
    if (!isEditing && !value) return null;

    return (
      <Card style={styles.fieldCard}>
        <Card.Content style={styles.fieldContent}>
          <Avatar.Icon size={36} icon={icon} style={styles.fieldIcon} />
          <View style={styles.fieldInfo}>
            <Text style={styles.label}>{label}</Text>
            {isEditing ? (
              <TextInput
                value={formData[key]}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, [key]: text }))}
                mode="flat"
                style={styles.input}
                dense
              />
            ) : (
              <Text style={styles.value}>{value || '-'}</Text>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Avatar.Text 
            size={80} 
            label={getInitials(contact.name)} 
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
          <Text style={styles.headerName}>{contact.name}</Text>
          {contact.title && <Text style={styles.headerTitle}>{contact.title}</Text>}
          {contact.company && <Text style={styles.headerCompany}>{contact.company}</Text>}
        </View>
      </View>

      <View style={styles.content}>
        {renderField('Office Phone', contact.phoneOffice, 'phoneOffice', 'phone')}
        {renderField('Mobile Phone', contact.phoneMobile, 'phoneMobile', 'cellphone')}
        {renderField('Fax', contact.phoneFax, 'phoneFax', 'fax')}
        {renderField('Email', contact.email, 'email', 'email')}
        {renderField('Country', contact.country, 'country', 'earth')}
        {renderField('Address', contact.address, 'address', 'map-marker')}

        <View style={styles.buttonContainer}>
          {isEditing ? (
            <>
              <Button 
                mode="contained" 
                onPress={handleSave} 
                style={styles.button}
                buttonColor="#6366f1"
                icon="content-save"
              >
                Save Changes
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => setIsEditing(false)} 
                style={styles.button}
                icon="close"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button 
                mode="contained" 
                onPress={() => setIsEditing(true)} 
                style={styles.button}
                buttonColor="#6366f1"
                icon="pencil"
              >
                Edit Contact
              </Button>
              <Button 
                mode="outlined" 
                onPress={handleDelete} 
                style={styles.button} 
                textColor="#E74C3C"
                icon="trash-can"
              >
                Delete Contact
              </Button>
            </>
          )}
        </View>
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
  },
  header: {
    backgroundColor: '#6366f1',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
    paddingBottom: 32,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  avatarLabel: {
    color: '#6366f1',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  headerCompany: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  content: {
    padding: 16,
  },
  fieldCard: {
    marginBottom: 12,
    elevation: 1,
    borderRadius: 12,
  },
  fieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldIcon: {
    backgroundColor: '#6366f1',
    marginRight: 12,
  },
  fieldInfo: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#636E72',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: '#2D3436',
  },
  input: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    marginVertical: 6,
  },
});
