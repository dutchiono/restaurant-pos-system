import { PrismaClient, OrderStatus, OrderItemStatus } from '@prisma/client';
import { io } from '../index';

const prisma = new PrismaClient();

export class OrderService {
  async createOrder(data: {
    tableId: string;
    customerId?: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
      notes?: string;
      modifiers?: any;
    }>;
    notes?: string;
  }) {
    const table = await prisma.table.findUnique({
      where: { id: data.tableId },
    });

    if (!table) {
      throw new Error('Table not found');
    }

    const order = await prisma.order.create({
      data: {
        tableId: data.tableId,
        customerId: data.customerId,
        status: 'OPEN',
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes,
            modifiers: item.modifiers,
            status: 'PENDING',
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
      },
    });

    // Update table status
    await prisma.table.update({
      where: { id: data.tableId },
      data: { status: 'OCCUPIED' },
    });

    // Emit WebSocket event
    io?.to(`restaurant:${table.floorPlanId}`).emit('order:new', order);

    return order;
  }

  async getOrderById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
        customer: true,
        payments: true,
      },
    });
  }

  async getOrdersByTable(tableId: string) {
    return prisma.order.findMany({
      where: {
        tableId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveOrders(restaurantId: string) {
    return prisma.order.findMany({
      where: {
        table: {
          floorPlan: {
            restaurantId,
          },
        },
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addItemsToOrder(orderId: string, items: Array<{
    menuItemId: string;
    quantity: number;
    notes?: string;
    modifiers?: any;
  }>) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes,
            modifiers: item.modifiers,
            status: 'PENDING',
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
      },
    });

    io?.to(`restaurant:${order.table.floorPlanId}`).emit('order:updated', updatedOrder);

    return updatedOrder;
  }

  async updateOrderItemStatus(itemId: string, status: OrderItemStatus) {
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: {
          include: { table: true },
        },
      },
    });

    if (!item) {
      throw new Error('Order item not found');
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
    });

    io?.to(`restaurant:${item.order.table.floorPlanId}`).emit('order:item:status:changed', {
      itemId,
      status,
      orderId: item.orderId,
    });

    return updatedItem;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
      },
    });

    io?.to(`restaurant:${order.table.floorPlanId}`).emit('order:updated', updatedOrder);

    return updatedOrder;
  }

  async completeOrder(orderId: string) {
    const order = await this.updateOrderStatus(orderId, 'COMPLETED');
    
    // Check if table has any other active orders
    const activeOrders = await prisma.order.count({
      where: {
        tableId: order.tableId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    });

    if (activeOrders === 0) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'DIRTY' },
      });
    }

    return order;
  }

  async cancelOrder(orderId: string, reason?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${order.notes || ''}\nCancellation reason: ${reason}` : order.notes,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
      },
    });

    io?.to(`restaurant:${order.table.floorPlanId}`).emit('order:updated', updatedOrder);

    return updatedOrder;
  }

  async getOrderTotal(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const subtotal = order.items.reduce((sum, item) => {
      return sum + (item.menuItem.price * item.quantity);
    }, 0);

    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;

    return {
      subtotal,
      tax,
      total,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }
}