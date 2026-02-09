import { PrismaClient } from '@prisma/client';
import { io } from '../index';

const prisma = new PrismaClient();

export class InventoryService {
  async getInventoryItems(restaurantId: string) {
    return prisma.inventoryItem.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
    });
  }

  async getInventoryItem(id: string) {
    return prisma.inventoryItem.findUnique({
      where: { id },
    });
  }

  async createInventoryItem(data: {
    name: string;
    restaurantId: string;
    unit: string;
    currentStock: number;
    minStock: number;
    maxStock?: number;
    costPerUnit: number;
    supplier?: string;
    category?: string;
  }) {
    const item = await prisma.inventoryItem.create({
      data,
    });

    // Check if stock is low
    if (item.currentStock <= item.minStock) {
      this.emitLowStockAlert(item);
    }

    return item;
  }

  async updateInventoryItem(id: string, data: any) {
    const item = await prisma.inventoryItem.update({
      where: { id },
      data,
    });

    // Check if stock is low
    if (item.currentStock <= item.minStock) {
      this.emitLowStockAlert(item);
    }

    return item;
  }

  async adjustStock(id: string, quantity: number, reason?: string) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new Error('Inventory item not found');
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: {
        currentStock: item.currentStock + quantity,
      },
    });

    // Log the transaction
    await prisma.inventoryTransaction.create({
      data: {
        inventoryItemId: id,
        quantity,
        type: quantity > 0 ? 'RESTOCK' : 'USAGE',
        reason,
      },
    });

    // Check if stock is low
    if (updatedItem.currentStock <= updatedItem.minStock) {
      this.emitLowStockAlert(updatedItem);
    }

    return updatedItem;
  }

  async getLowStockItems(restaurantId: string) {
    return prisma.inventoryItem.findMany({
      where: {
        restaurantId,
        currentStock: {
          lte: prisma.inventoryItem.fields.minStock,
        },
      },
      orderBy: { currentStock: 'asc' },
    });
  }

  async getInventoryTransactions(itemId: string, limit = 50) {
    return prisma.inventoryTransaction.findMany({
      where: { inventoryItemId: itemId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async deleteInventoryItem(id: string) {
    return prisma.inventoryItem.delete({
      where: { id },
    });
  }

  private emitLowStockAlert(item: any) {
    io?.to(`restaurant:${item.restaurantId}`).emit('inventory:alert', {
      itemId: item.id,
      name: item.name,
      currentStock: item.currentStock,
      minStock: item.minStock,
      message: `Low stock alert: ${item.name} is running low (${item.currentStock} ${item.unit} remaining)`,
    });
  }
}
