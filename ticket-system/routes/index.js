const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

const { login, profile } = require('../controllers/authController');
const { createUser, getUsers, getUserById, filterUsers, updateStatus, updateUser, deleteUser } = require('../controllers/userController');
const { getCareers, filterCareers } = require('../controllers/careerController');
const { getTypes, getTypeById, createType, updateType, deleteType } = require('../controllers/typeController');
const { createTicket, getTickets, getTicketById, filterTickets, updateTicket, updateTicketStatus, assignTicket, getTicketsByUser } = require('../controllers/ticketController');
const { ticketsByStatus, ticketsByUser, avgResolutionTime } = require('../controllers/kpiController');

// Auth
router.post('/auth/login', login);
router.get('/auth/profile', auth, profile);

// Users
router.post('/users', auth, createUser);
router.get('/users', auth, getUsers);
router.get('/users/filter', auth, filterUsers);
router.get('/users/:id', auth, getUserById);
router.put('/users/:id', auth, updateUser);
router.patch('/users/:id/status', auth, updateStatus);
router.delete('/users/:id', auth, deleteUser);

// Careers
router.get('/careers', auth, getCareers);
router.get('/careers/filter', auth, filterCareers);

// Types
router.get('/types', auth, getTypes);
router.get('/types/:id', auth, getTypeById);
router.post('/types', auth, createType);
router.put('/types/:id', auth, updateType);
router.delete('/types/:id', auth, deleteType);

// Tickets
router.post('/tickets', auth, createTicket);
router.get('/tickets', auth, getTickets);
router.get('/tickets/filter', auth, filterTickets);
router.get('/tickets/user/:user_id', auth, getTicketsByUser);
router.get('/tickets/:id', auth, getTicketById);
router.put('/tickets/:id', auth, updateTicket);
router.patch('/tickets/:id/status', auth, updateTicketStatus);
router.post('/tickets/:id/assign', auth, assignTicket);

// KPI
router.get('/kpi/tickets/status', auth, ticketsByStatus);
router.get('/kpi/tickets/user', auth, ticketsByUser);
router.get('/kpi/tickets/avg-time', auth, avgResolutionTime);

module.exports = router;
