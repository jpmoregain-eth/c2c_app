export interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  phoneOffice: string;
  phoneMobile: string;
  phoneFax: string;
  email: string;
  address: string;
  country: string;
  imageUri?: string;
  createdAt: number;
  updatedAt: number;
}

export type RootStackParamList = {
  Contacts: undefined;
  Camera: undefined;
  Batch: undefined;
  Processing: { imageUri: string };
  ContactDetail: { contactId: string };
};
