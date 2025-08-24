// Beehiiv API integration
const BEEHIIV_API_KEY = "vl8Di3vswjanZgCEDzHfaWej4Np8BqOuLWS6GqUNgXJ0vGVXAlAgXyqFFeWdZiCG";
const PUBLICATION_ID = "57a1af85-50f4-44eb-bde7-c88cccd2fcd3";
const BEEHIIV_API_BASE = "https://api.beehiiv.com/v2";

export interface BeehiivSubscriptionResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const subscribeToNewsletter = async (email: string): Promise<BeehiivSubscriptionResponse> => {
  try {
    const response = await fetch(`${BEEHIIV_API_BASE}/publications/${PUBLICATION_ID}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BEEHIIV_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        reactivate_existing: false,
        send_welcome_email: true,
        utm_source: "website",
        utm_medium: "newsletter_signup"
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: "Successfully subscribed to newsletter!",
        data
      };
    } else {
      // Handle specific Beehiiv error responses
      if (data.errors && Array.isArray(data.errors)) {
        const errorMessage = data.errors.map((error: any) => error.message || error).join(', ');
        return {
          success: false,
          message: errorMessage
        };
      }
      
      return {
        success: false,
        message: data.message || "Failed to subscribe. Please try again."
      };
    }
  } catch (error) {
    console.error('Beehiiv subscription error:', error);
    return {
      success: false,
      message: "Network error. Please check your connection and try again."
    };
  }
};

export const getSubscriptionStatus = async (email: string) => {
  try {
    const response = await fetch(`${BEEHIIV_API_BASE}/publications/${PUBLICATION_ID}/subscriptions/by_email/${email}`, {
      headers: {
        'Authorization': `Bearer ${BEEHIIV_API_KEY}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { exists: true, data };
    }
    
    return { exists: false };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { exists: false };
  }
};