// src/components/Notifications.js
import React, { useEffect } from 'react';
import { notification } from 'antd';
import io from 'socket.io-client';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

const getSocketURL = () => {
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  } else if (window.location.hostname.startsWith('192.168')) {
    return 'http://192.168.0.101:5000';
  } else {
    return 'http://188.175.32.34';
  }
};

const socket = io(getSocketURL());

const Notifications = ({ updatePendingTasksCount }) => {
  useEffect(() => {
    // Při připojení získat počáteční data
    socket.on('connect', () => {
      console.log('Připojeno k Socket.IO serveru');
    });

    // Příjem počátečních dat
    socket.on('initialData', (data) => {
      const { pendingTasks } = data;
      updatePendingTasksCount(pendingTasks);
    });

    // Příjem notifikací
    socket.on('notification', (data) => {
      if (data.type === 'upcomingTask') {
        const { task } = data;

        // Ukázat notifikaci
        notification.open({
          message: 'Připomenutí Úkolu',
          description: `Úkol "${task.description}" má termín splnění dne ${dayjs(task.dueDate).format('YYYY-MM-DD HH:mm')}.`,
          placement: 'bottomRight',
          duration: 5,
        });

        // Aktualizace počtu naplánovaných úkolů/servisů
        updatePendingTasksCount(prevCount => prevCount + 1);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('initialData');
      socket.off('notification');
    };
  }, [updatePendingTasksCount]);

  return null;
};

Notifications.propTypes = {
  updatePendingTasksCount: PropTypes.func.isRequired,
};

export default Notifications;
