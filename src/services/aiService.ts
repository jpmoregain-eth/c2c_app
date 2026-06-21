import { Contact } from '../types';
import { AGNES_API_KEY, AGNES_BASE_URL } from './config';

const TIMEOUT_MS = 60000; // 60 second timeout for Agnes 2.0 Flash
const MAX_RETRIES = Infinity; // Unlimited retries until success
const RETRY_DELAY_MS = 2000; // 2 second delay between retries

// Helper to validate email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper to validate phone (at least 5 digits)
function isValidPhone(phone: string): boolean {
  return /\d{5,}/.test(phone.replace(/\D/g, ''));
}

// Helper to sanitize extracted fields
function sanitizeContact(data: Partial<Contact>): Partial<Contact> {
  return {
    name: (data.name || '').trim(),
    title: (data.title || '').trim(),
    company: (data.company || '').trim(),
    phoneOffice: isValidPhone(data.phoneOffice || '') ? (data.phoneOffice || '').trim() : '',
    phoneMobile: isValidPhone(data.phoneMobile || '') ? (data.phoneMobile || '').trim() : '',
    phoneFax: isValidPhone(data.phoneFax || '') ? (data.phoneFax || '').trim() : '',
    email: isValidEmail(data.email || '') ? (data.email || '').trim() : '',
    address: (data.address || '').trim(),
    country: (data.country || '').trim(),
  };
}

export async function extractContactFromImage(imageUri: string): Promise<Partial<Contact>> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Processing image URI (attempt ${attempt + 1}):`, imageUri);
      
      // Handle content:// URIs by copying to a temp file first
      let filePath = imageUri;
      const RNFS = require('react-native-fs');
      
      if (imageUri.startsWith('content://')) {
        console.log('Converting content URI to file path...');
        const destPath = `${RNFS.CachesDirectoryPath}/temp_card.jpg`;
        await RNFS.copyFile(imageUri, destPath);
        filePath = `file://${destPath}`;
        console.log('Copied to:', filePath);
      }

      // Read and compress image
      console.log('Compressing image...');
      const compressedPath = `${RNFS.CachesDirectoryPath}/compressed_card.jpg`;
      
      // Simple compression: copy and we'll rely on base64 size reduction
      // For better compression, use react-native-image-resizer in production
      await RNFS.copyFile(filePath.replace('file://', ''), compressedPath);
      
      const base64 = await RNFS.readFile(compressedPath, 'base64');
      console.log('Image converted to base64, length:', base64.length);

      const dataUri = `data:image/jpeg;base64,${base64}`;

      console.log('Sending to Agnes AI...');

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const apiResponse = await fetch(`${AGNES_BASE_URL}/chat/completions`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AGNES_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'agnes-2.0-flash',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Extract contact information from this business card image. Return ONLY a JSON object with these fields: name (full name), title (job title), company (company name), phoneOffice (office/direct landline number), phoneMobile (mobile/cell number), phoneFax (fax number if present), email (email address), address (physical address), country (country name based on address or phone country code). If a field is not found, use empty string. Return valid JSON only, no markdown, no explanation.',
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: dataUri,
                    },
                  },
                ],
              },
            ],
            max_tokens: 500,
          }),
        });

        clearTimeout(timeoutId);

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          throw new Error(`API Error: ${apiResponse.status} - ${errorText}`);
        }

        const data = await apiResponse.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse JSON from response
        let extracted: Partial<Contact> = {};

        try {
          // Try to find JSON in the response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            extracted = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback: try parsing the whole content
            extracted = JSON.parse(content);
          }
        } catch (parseError) {
          console.warn('Failed to parse JSON response, using fallback:', content);
          // Fallback: try to extract info manually
          extracted = {
            name: extractField(content, 'name') || '',
            title: extractField(content, 'title') || '',
            company: extractField(content, 'company') || '',
            phoneOffice: extractField(content, 'phoneOffice') || '',
            phoneMobile: extractField(content, 'phoneMobile') || '',
            phoneFax: extractField(content, 'phoneFax') || '',
            email: extractField(content, 'email') || '',
            address: extractField(content, 'address') || '',
            country: extractField(content, 'country') || '',
          };
        }

        // Sanitize and validate before returning
        return sanitizeContact(extracted);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1} failed:`, error);
      console.log(`Retrying in ${RETRY_DELAY_MS/1000}s... (attempt ${attempt + 2})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  
  // All retries exhausted
  throw lastError || new Error('Extraction failed after retries');
}

function extractField(text: string, fieldName: string): string | null {
  // More robust regex that handles multi-word values
  const regex = new RegExp(`["']?${fieldName}["']?\\s*[:=]\\s*["']([^"']+)["']`, 'i');
  const match = text.match(regex);
  if (match) return match[1];
  
  // Fallback: try without quotes
  const regex2 = new RegExp(`${fieldName}\\s*[:=]\\s*([^,\\n\r}]+)`, 'i');
  const match2 = text.match(regex2);
  return match2 ? match2[1].trim() : null;
}

export function generateCSV(contacts: Contact[]): string {
  const headers = [
    'Name',
    'Given Name',
    'Family Name',
    'Organization 1 - Name',
    'Organization 1 - Title',
    'Phone 1 - Value',
    'Phone 1 - Type',
    'Phone 2 - Value',
    'Phone 2 - Type',
    'Phone 3 - Value',
    'Phone 3 - Type',
    'E-mail 1 - Value',
    'E-mail 1 - Type',
    'Address 1 - Formatted',
    'Address 1 - Type',
    'Address 1 - Country',
  ];
  
  const rows = contacts.map((c) => {
    const nameParts = (c.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Ensure no undefined values
    const safe = (val: string | undefined) => (val || '').replace(/"/g, '""');
    
    return [
      safe(c.name),
      safe(firstName),
      safe(lastName),
      safe(c.company),
      safe(c.title),
      safe(c.phoneOffice),
      'Work',
      safe(c.phoneMobile),
      'Mobile',
      safe(c.phoneFax),
      'Fax',
      safe(c.email),
      'Work',
      safe(c.address),
      'Work',
      safe(c.country),
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}
