import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  afterInit() {
    this.logger.log('⚡ Socket.IO Realtime Gateway ishga tushdi');
  }

  handleConnection(client: Socket) {
    this.logger.log(`🟢 Qurilma ulandi: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔴 Qurilma uzildi: ${client.id}`);
  }

  /**
   * Buyurtma yaratilganda
   */
  emitOrderCreated(order: any) {
    this.server.emit('order:created', order);
  }

  /**
   * Buyurtma yangilanganda (taom qo'shildi, o'chirildi, status o'zgardi)
   */
  emitOrderUpdated(order: any) {
    this.server.emit('order:updated', order);
  }

  /**
   * Stol holati o'zgarganda (bo'sh / band / to'lov kutilmoqda)
   */
  emitTableStatus(table: any) {
    this.server.emit('table:status', table);
  }

  /**
   * Oshxonaga yangi buyurtma yuborilganda (KDS va oshxona printeri uchun)
   */
  emitKitchenNewTicket(ticket: any) {
    this.server.emit('kitchen:new-ticket', ticket);
  }

  /**
   * Ombor qoldig'i kam qolganda ogohlantirish
   */
  emitStockLow(item: any) {
    this.server.emit('stock:low', item);
  }

  /**
   * Sinxronizatsiya holati yangilanganda
   */
  emitSyncStatus(status: any) {
    this.server.emit('sync:status', status);
  }
}
