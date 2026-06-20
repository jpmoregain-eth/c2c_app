import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from '../types';

const STORAGE_KEY = '@card2contact_contacts';

interface ContactContextType {
  contacts: Contact[];
  loading: boolean;
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  getContactById: (id: string) => Contact | undefined;
}

const ContactContext = createContext<ContactContextType | undefined>(undefined);

export function ContactProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setContacts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveContacts = async (updatedContacts: Contact[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedContacts));
    } catch (error) {
      console.error('Failed to save contacts:', error);
      throw error;
    }
  };

  const addContact = async (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    
    // Check for duplicates by name + company (case-insensitive)
    const normalizedName = (contactData.name || '').trim().toLowerCase();
    const normalizedCompany = (contactData.company || '').trim().toLowerCase();
    
    setContacts(prev => {
      // Find existing contact with same name and company
      const existingIndex = prev.findIndex(c => 
        c.name.trim().toLowerCase() === normalizedName && 
        c.company.trim().toLowerCase() === normalizedCompany &&
        normalizedName !== '' && normalizedName !== 'unknown'
      );
      
      if (existingIndex >= 0) {
        // Merge with existing contact - fill in empty fields
        const existing = prev[existingIndex];
        const merged: Contact = {
          ...existing,
          title: existing.title || contactData.title || '',
          phoneOffice: existing.phoneOffice || contactData.phoneOffice || '',
          phoneMobile: existing.phoneMobile || contactData.phoneMobile || '',
          phoneFax: existing.phoneFax || contactData.phoneFax || '',
          email: existing.email || contactData.email || '',
          address: existing.address || contactData.address || '',
          country: existing.country || contactData.country || '',
          imageUri: existing.imageUri || contactData.imageUri,
          updatedAt: now,
        };
        
        const updated = [...prev];
        updated[existingIndex] = merged;
        saveContacts(updated);
        return updated;
      }
      
      // Create new contact
      const newContact: Contact = {
        ...contactData,
        id: `contact_${now}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [...prev, newContact];
      saveContacts(updated);
      return updated;
    });
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    const updated = contacts.map((c) =>
      c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
    );
    setContacts(updated);
    await saveContacts(updated);
  };

  const deleteContact = async (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    await saveContacts(updated);
  };

  const getContactById = (id: string) => contacts.find((c) => c.id === id);

  return (
    <ContactContext.Provider value={{ contacts, loading, addContact, updateContact, deleteContact, getContactById }}>
      {children}
    </ContactContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactContext);
  if (!context) throw new Error('useContacts must be used within a ContactProvider');
  return context;
}
