import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, ActivityIndicator, Avatar } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Contact } from '../types';
import { useContacts } from '../services/ContactContext';
import { generateCSV } from '../services/aiService';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

type ContactsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Contacts'>;
};

export default function ContactsScreen({ navigation }: ContactsScreenProps) {
  const { contacts, loading, deleteContact } = useContacts();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = useCallback((contact: Contact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteContact(contact.id),
        },
      ]
    );
  }, [deleteContact]);

  const exportToCSV = useCallback(async () => {
    try {
      const csvContent = generateCSV(contacts);
      const downloadsPath = `${RNFS.ExternalStorageDirectoryPath}/Download`;
      const filePath = `${downloadsPath}/Card2Contact_Export_${Date.now()}.csv`;
      
      const dirExists = await RNFS.exists(downloadsPath);
      if (!dirExists) {
        await RNFS.mkdir(downloadsPath);
      }
      
      await RNFS.writeFile(filePath, csvContent, 'utf8');
      
      Alert.alert(
        'Export Successful',
        `CSV saved to Downloads folder`,
        [
          { 
            text: 'Share', 
            onPress: async () => {
              try {
                await Share.open({
                  url: `file://${filePath}`,
                  type: 'text/csv',
                  filename: 'contacts',
                });
              } catch (shareError) {
                console.log('Share cancelled or failed:', shareError);
              }
            }
          },
          { text: 'OK', style: 'default' }
        ]
      );
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [contacts]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderContact = useCallback(({ item }: { item: Contact }) => (
    <Card style={styles.card} onPress={() => navigation.navigate('ContactDetail', { contactId: item.id })}>
      <Card.Content style={styles.cardContent}>
        <Avatar.Text 
          size={50} 
          label={getInitials(item.name)} 
          style={styles.avatar}
          labelStyle={styles.avatarLabel}
        />
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{item.name || 'Unnamed Contact'}</Text>
          {item.title ? <Text style={styles.subtitle}>{item.title}</Text> : null}
          {item.company ? <Text style={styles.company}>{item.company}</Text> : null}
          <View style={styles.detailsRow}>
            {item.phoneOffice ? <Text style={styles.detail}>📞 {item.phoneOffice}</Text> : null}
            {item.phoneMobile ? <Text style={styles.detail}>📱 {item.phoneMobile}</Text> : null}
          </View>
        </View>
        <IconButton
          icon="trash-can"
          size={20}
          onPress={() => handleDelete(item)}
          iconColor="#E74C3C"
          style={styles.deleteButton}
        />
      </Card.Content>
    </Card>
  ), [navigation, handleDelete]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Contacts</Text>
        <Text style={styles.headerSubtitle}>{contacts.length} contacts</Text>
      </View>

      <TextInput
        placeholder="Search contacts..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
        mode="outlined"
        left={<TextInput.Icon icon="magnify" />}
      />
      
      <View style={styles.buttonRow}>
        <Button
          mode="contained"
          icon="camera"
          onPress={() => navigation.navigate('Camera')}
          style={styles.actionButton}
          buttonColor="#6366f1"
        >
          Scan
        </Button>
        <Button
          mode="contained"
          icon="image-multiple"
          onPress={() => navigation.navigate('Batch')}
          style={styles.actionButton}
          buttonColor="#8B5CF6"
        >
          Batch
        </Button>
        <Button
          mode="outlined"
          icon="export"
          onPress={exportToCSV}
          disabled={contacts.length === 0}
          style={styles.actionButton}
        >
          Export
        </Button>
      </View>

      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        style={styles.listBackground}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Avatar.Icon size={80} icon="card-account-details" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No contacts yet</Text>
            <Text style={styles.emptySubtext}>Tap "Scan" to add your first contact</Text>
          </View>
        }
      />
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
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    margin: 16,
    marginTop: 12,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  list: {
    padding: 16,
    paddingTop: 0,
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
  avatar: {
    backgroundColor: '#6366f1',
    marginRight: 12,
  },
  avatarLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  subtitle: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 2,
  },
  company: {
    fontSize: 14,
    color: '#6C63FF',
    marginTop: 2,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  detail: {
    fontSize: 12,
    color: '#B2BEC3',
    marginRight: 12,
  },
  deleteButton: {
    margin: 0,
  },
  listBackground: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  emptyIcon: {
    backgroundColor: '#E8E8E8',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#B2BEC3',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#B2BEC3',
    marginTop: 8,
  },
});
