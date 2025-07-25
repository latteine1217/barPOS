import { Order, OrderItem, ApiResponse } from '../types';

const NOTION_API_VERSION = '2022-06-28';
const NOTION_BASE_URL = 'https://api.notion.com/v1';

interface NotionOrderUpdates {
  status?: string;
  total?: number;
}

interface NotionPage {
  id: string;
  created_time: string;
  properties: {
    [key: string]: any;
  };
}

interface NotionRichText {
  text: {
    content: string;
  };
}

class NotionService {
  private token: string;
  private databaseId: string;

  constructor(token: string, databaseId: string) {
    this.token = token;
    this.databaseId = databaseId;
  }

  async testConnection(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${NOTION_BASE_URL}/databases/${this.databaseId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Notion-Version': NOTION_API_VERSION,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async createOrder(order: Order): Promise<ApiResponse> {
    try {
      const properties = {
        '訂單編號': {
          title: [{ text: { content: order.id } }]
        },
        '桌號': {
          number: order.tableNumber
        },
        '總額': {
          number: order.total
        },
        '狀態': {
          select: { name: order.status }
        },
        '建立時間': {
          date: { start: order.createdAt }
        }
      };

      if (order.items && order.items.length > 0) {
        properties['餐點'] = {
          rich_text: [{
            text: {
              content: order.items.map(item => `${item.name} x${item.quantity}`).join(', ')
            }
          }]
        };
      }

      const response = await fetch(`${NOTION_BASE_URL}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Notion-Version': NOTION_API_VERSION,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parent: { database_id: this.databaseId },
          properties
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async updateOrder(notionPageId: string, updates: NotionOrderUpdates): Promise<ApiResponse> {
    try {
      const properties: any = {};
      
      if (updates.status) {
        properties['狀態'] = { select: { name: updates.status } };
      }
      
      if (updates.total !== undefined) {
        properties['總額'] = { number: updates.total };
      }

      const response = await fetch(`${NOTION_BASE_URL}/pages/${notionPageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Notion-Version': NOTION_API_VERSION,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ properties })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async fetchOrders(): Promise<ApiResponse<Order[]>> {
    try {
      const response = await fetch(`${NOTION_BASE_URL}/databases/${this.databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Notion-Version': NOTION_API_VERSION,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sorts: [
            {
              property: '建立時間',
              direction: 'descending'
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const orders = data.results.map((page: NotionPage) => this.parseNotionPageToOrder(page));
      
      return { success: true, data: orders };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private parseNotionPageToOrder(page: NotionPage): Order {
    const properties = page.properties;
    
    return {
      id: properties['訂單編號']?.title?.[0]?.text?.content || page.id,
      notionPageId: page.id,
      tableNumber: properties['桌號']?.number || 0,
      total: properties['總額']?.number || 0,
      subtotal: properties['總額']?.number || 0,
      status: properties['狀態']?.select?.name || 'pending',
      customers: 1,
      createdAt: properties['建立時間']?.date?.start || page.created_time,
      updatedAt: page.created_time,
      items: this.parseItemsFromRichText(properties['餐點']?.rich_text)
    } as Order;
  }

  private parseItemsFromRichText(richText?: NotionRichText[]): OrderItem[] {
    if (!richText || richText.length === 0) return [];
    
    const itemsText = richText[0]?.text?.content || '';
    return itemsText.split(', ').map((item, index) => {
      const match = item.match(/^(.+) x(\d+)$/);
      if (match) {
        return {
          id: `item-${index}`,
          name: match[1],
          quantity: parseInt(match[2], 10),
          price: 0
        };
      }
      return { 
        id: `item-${index}`,
        name: item, 
        quantity: 1,
        price: 0
      };
    });
  }
}

export default NotionService;