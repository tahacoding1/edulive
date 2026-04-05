const router  = require('express').Router();
const Content = require('../models/Content');

// GET /api/content  — public, returns all website sections
router.get('/', async (req, res) => {
  try {
    const items = await Content.find();
    const content = {};
    items.forEach(i => { content[i.section] = i.data; });
    res.json({ content });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
