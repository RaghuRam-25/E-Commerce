const express = require('express')
const router = express.Router()
const {
  subscribe,
  getAllSubscribers,
  updateSubscriberStatus,
  deleteSubscriber,
  getSubscriberStats,
} = require('../controllers/subscriberController')

router.get('/stats', getSubscriberStats)
router.get('/', getAllSubscribers)
router.post('/', subscribe)
router.patch('/:id', updateSubscriberStatus)
router.delete('/:id', deleteSubscriber)

module.exports = router
