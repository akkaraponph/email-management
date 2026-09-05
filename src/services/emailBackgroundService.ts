// src/services/emailBackgroundService.ts
import { BackgroundSettings } from '@/types/email-templates';

const BACKGROUND_STORAGE_PREFIX = 'email-template-bg-';

// Function to get background settings for a template
export async function getTemplateBackground(templateId: string): Promise<BackgroundSettings | null> {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(`${BACKGROUND_STORAGE_PREFIX}${templateId}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
  }

  try {
    const response = await fetch(`/api/templates/${templateId}/background`);

    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    if (typeof window !== 'undefined' && data) {
      localStorage.setItem(`${BACKGROUND_STORAGE_PREFIX}${templateId}`, JSON.stringify(data));
    }
    return data;
  } catch {
    return null;
  }
}

// Function to save background settings for a template
export async function saveTemplateBackground(
  templateId: string, 
  settings: BackgroundSettings
): Promise<BackgroundSettings> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${BACKGROUND_STORAGE_PREFIX}${templateId}`, JSON.stringify(settings));
  }

  try {
    const response = await fetch(`/api/templates/${templateId}/background`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      return settings;
    }
    
    return response.json();
  } catch {
    return settings;
  }
}


// Function to update email template background settings
export async function updateTemplateBackground(
	templateId: string,
	backgroundSettings: {
	  bodyBgColor: string;
	  containerBgColor: string;
	  headerBgColor: string;
	  contentBgColor: string;
	  footerBgColor: string;
	  maxWidth: string;
	}
  ): Promise<any> {
	try {
	  const response = await fetch(`/api/templates/${templateId}/background`, {
		method: 'PUT',
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify(backgroundSettings),
	  });
	  
	  if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to update background settings');
	  }
	  
	  return response.json();
	} catch (error) {
	  console.error('Error updating background settings:', error);
	  throw error;
	}
  }