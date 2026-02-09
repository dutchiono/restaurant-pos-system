import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnalyticsService {
  async getSalesAnalytics(restaurantId: string, startDate: Date, endDate: Date) {
    const orders = await prisma.order.findMany({
      where: {
        table: {
          floorPlan: {
            restaurantId,
          },
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        payments: {
          where: {
            status: 'COMPLETED',
          },
        },
      },
    });

    const totalRevenue = orders.reduce((sum, order) => {
      return sum + order.payments.reduce((pSum, payment) => pSum + payment.amount, 0);
    }, 0);

    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const itemsSold = orders.reduce((sum, order) => {
      return sum + order.items.reduce((iSum, item) => iSum + item.quantity, 0);
    }, 0);

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      itemsSold,
      orders,
    };
  }

  async getTopSellingItems(restaurantId: string, startDate: Date, endDate: Date, limit = 10) {
    const orders = await prisma.order.findMany({
      where: {
        table: {
          floorPlan: {
            restaurantId,
          },
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    const itemStats = new Map<string, { name: string; quantity: number; revenue: number }>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = itemStats.get(item.menuItemId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.menuItem.price * item.quantity;
        } else {
          itemStats.set(item.menuItemId, {
            name: item.menuItem.name,
            quantity: item.quantity,
            revenue: item.menuItem.price * item.quantity,
          });
        }
      });
    });

    return Array.from(itemStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  }

  async getRevenueByHour(restaurantId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        table: {
          floorPlan: {
            restaurantId,
          },
        },
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
      include: {
        payments: {
          where: {
            status: 'COMPLETED',
          },
        },
      },
    });

    const hourlyRevenue = Array(24).fill(0);

    orders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      const revenue = order.payments.reduce((sum, payment) => sum + payment.amount, 0);
      hourlyRevenue[hour] += revenue;
    });

    return hourlyRevenue.map((revenue, hour) => ({
      hour,
      revenue,
    }));
  }

  async getTablePerformance(restaurantId: string, startDate: Date, endDate: Date) {
    const tables = await prisma.table.findMany({
      where: {
        floorPlan: {
          restaurantId,
        },
      },
      include: {
        orders: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: 'COMPLETED',
          },
          include: {
            payments: {
              where: {
                status: 'COMPLETED',
              },
            },
          },
        },
      },
    });

    return tables.map((table) => ({
      tableNumber: table.number,
      totalOrders: table.orders.length,
      totalRevenue: table.orders.reduce((sum, order) => {
        return sum + order.payments.reduce((pSum, payment) => pSum + payment.amount, 0);
      }, 0),
      averageOrderValue:
        table.orders.length > 0
          ? table.orders.reduce((sum, order) => {
              return sum + order.payments.reduce((pSum, payment) => pSum + payment.amount, 0);
            }, 0) / table.orders.length
          : 0,
    }));
  }

  async getEmployeePerformance(restaurantId: string, startDate: Date, endDate: Date) {
    const shifts = await prisma.shift.findMany({
      where: {
        employee: {
          restaurantId,
        },
        clockIn: {
          gte: startDate,
          lte: endDate,
        },
        clockOut: {
          not: null,
        },
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
            hourlyRate: true,
          },
        },
      },
    });

    const employeeStats = new Map<string, any>();

    shifts.forEach((shift) => {
      const key = `${shift.employee.firstName} ${shift.employee.lastName}`;
      const existing = employeeStats.get(key);
      const hoursWorked = shift.hoursWorked || 0;
      const laborCost = hoursWorked * (shift.employee.hourlyRate || 0);

      if (existing) {
        existing.totalHours += hoursWorked;
        existing.totalShifts += 1;
        existing.totalLaborCost += laborCost;
      } else {
        employeeStats.set(key, {
          name: key,
          role: shift.employee.role,
          totalHours: hoursWorked,
          totalShifts: 1,
          totalLaborCost: laborCost,
        });
      }
    });

    return Array.from(employeeStats.values());
  }

  async getDashboardSummary(restaurantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todaySales, activeOrders, lowStockItems, activeShifts] = await Promise.all([
      this.getSalesAnalytics(restaurantId, today, tomorrow),
      prisma.order.count({
        where: {
          table: {
            floorPlan: {
              restaurantId,
            },
          },
          status: {
            in: ['OPEN', 'IN_PROGRESS'],
          },
        },
      }),
      prisma.inventoryItem.count({
        where: {
          restaurantId,
          currentStock: {
            lte: prisma.inventoryItem.fields.minStock,
          },
        },
      }),
      prisma.shift.count({
        where: {
          employee: {
            restaurantId,
          },
          clockOut: null,
        },
      }),
    ]);

    return {
      todayRevenue: todaySales.totalRevenue,
      todayOrders: todaySales.totalOrders,
      activeOrders,
      lowStockItems,
      activeEmployees: activeShifts,
    };
  }
}
