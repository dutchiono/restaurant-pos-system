import React, { useEffect, useState } from 'react';
import { Order, OrderItem, OrderItemStatus } from '../types/order.types';
import { socketClient } from '../lib/socket';

interface KitchenDisplayProps {
  restaurantId: string;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ restaurantId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing'>('all');

  useEffect(() => {
    const socket = socketClient.getSocket();
    if (!socket) return;

    // Join kitchen room
    socket.emit('kitchen:join');

    // Listen for new orders
    socket.on('kitchen:order:new', (order: Order) => {
      setOrders((prev) => [order, ...prev]);
    });

    // Listen for order updates
    socket.on('kitchen:order:updated', (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
      );
    });

    // Listen for item status changes
    socket.on('kitchen:item:completed', ({ orderId, itemId }: any) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,
              items: order.items.map((item) =>
                item.id === itemId ? { ...item, status: OrderItemStatus.READY } : item
              ),
            };
          }
          return order;
        })
      );
    });

    return () => {
      socket.off('kitchen:order:new');
      socket.off('kitchen:order:updated');
      socket.off('kitchen:item:completed');
    };
  }, []);

  const handleItemStatusChange = async (itemId: string, status: OrderItemStatus) => {
    try {
      const socket = socketClient.getSocket();
      socket?.emit('kitchen:item:complete', { itemId, status });
    } catch (error) {
      console.error('Failed to update item status:', error);
    }
  };

  const getItemsByStatus = (items: OrderItem[]) => {
    if (filter === 'pending') {
      return items.filter((item) => item.status === OrderItemStatus.PENDING);
    }
    if (filter === 'preparing') {
      return items.filter((item) => item.status === OrderItemStatus.PREPARING);
    }
    return items;
  };

  const activeOrders = orders.filter((order) =>
    order.items.some((item) =>
      [OrderItemStatus.PENDING, OrderItemStatus.PREPARING].includes(item.status)
    )
  );

  return (
    <div className="kitchen-display">
      <div className="kds-header">
        <h2>Kitchen Display System</h2>
        <div className="filter-buttons">
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'active' : ''}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={filter === 'pending' ? 'active' : ''}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('preparing')}
            className={filter === 'preparing' ? 'active' : ''}
          >
            Preparing
          </button>
        </div>
      </div>

      <div className="kds-orders">
        {activeOrders.length === 0 ? (
          <div className="empty-state">
            <p>No active orders in kitchen</p>
          </div>
        ) : (
          activeOrders.map((order) => {
            const filteredItems = getItemsByStatus(order.items);
            if (filteredItems.length === 0) return null;

            return (
              <div key={order.id} className="kds-order-card">
                <div className="kds-order-header">
                  <div className="order-info">
                    <h3>Table {order.table.number}</h3>
                    <span className="order-time">
                      {new Date(order.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="elapsed-time">
                    {Math.floor(
                      (Date.now() - new Date(order.createdAt).getTime()) / 60000
                    )}{' '}
                    min
                  </div>
                </div>

                <div className="kds-items">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`kds-item ${item.status.toLowerCase()}`}
                    >
                      <div className="item-qty">{item.quantity}x</div>
                      <div className="item-details">
                        <h4>{item.menuItem.name}</h4>
                        {item.notes && (
                          <div className="item-notes">Note: {item.notes}</div>
                        )}
                        {item.modifiers && (
                          <div className="item-modifiers">
                            Mods: {JSON.stringify(item.modifiers)}
                          </div>
                        )}
                      </div>
                      <div className="item-actions">
                        {item.status === OrderItemStatus.PENDING && (
                          <button
                            onClick={() =>
                              handleItemStatusChange(
                                item.id,
                                OrderItemStatus.PREPARING
                              )
                            }
                            className="btn btn-start"
                          >
                            Start
                          </button>
                        )}
                        {item.status === OrderItemStatus.PREPARING && (
                          <button
                            onClick={() =>
                              handleItemStatusChange(item.id, OrderItemStatus.READY)
                            }
                            className="btn btn-ready"
                          >
                            Ready
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
