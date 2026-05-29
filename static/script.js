const API = '/api/menu';
let items = [];
let activeFilter = 'ALL';
let editingId = null;

// fetch and render
async function loadMenu() {
    try {
        const res = await fetch(API);
        const data = await res.json();
        items = Array.isArray(data) ? data : [];
        render();
    } catch (err) {
        console.error('Failed to load menu:', err);
        items = [];
        render();
    }
}

function render(){
    const container = document.getElementById('main-content');
    const categories = ['Starters', 'Mains', 'Desserts', 'Drinks'];
    const filtered = activeFilter === 'ALL' 
        ? [...items] 
        : items.filter(i => i.category === activeFilter);

    const byCat = {};
    categories.forEach(c =>byCat[c] =[]);
    filtered.forEach(i => { if (byCat[i.category]) byCat[i.category].push(i); });

    let html = '';
    categories.forEach(cat =>{
        const group = byCat[cat];
        if (activeFilter !== 'ALL' && cat !== activeFilter) return;
        if (activeFilter === 'ALL' && group.length === 0) return;
        html += `<div class= "section-title"> ${cat}</div><div class="menu-grid">`;
        if (group.length === 0){
            html += `<div class="empty">No ${cat.toLowerCase()} yet - add one above.</div>`;
        }else{
            group.forEach(item => {
                html += `
                    <div class="menu-card" style="animation-delay:${Math.random()*0.5}s">
                        <div class="card-category">${item.category}</div>
                        <div class="card-name">${item.name}</div>
                        <div class="card-desc">${item.description || ''}</div>
                        <div class="card-footer">
                            <div class="card-price">${parseFloat(item.price).toFixed(2)}</div>
                            <div class="card-actions">
                                <button class="icon-btn" title="Edit" onclick="openModal('${item.id}')">Edit</button>
                                <button class="icon-btn del" title="Delete" onclick="deleteItem('${item.id}')">X</button>
                            </div>
                        </div>
                    </div>`;
            });
        }
        html += `</div>`
    });
    if (!html) html = `<div class="empty"> No Items match this filter.</div>`;
    container.innerHTML = html;
}

// filter
function setFilter(cat, btn){
    activeFilter = cat;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // fadeout
    const container = document.getElementById('main-content');
    container.style.opacity = '0';
    container.style.transform = 'translateY(10px)';

    setTimeout(()=> {
        render();
        container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 150);
    
}

// modal
function openModal(id = null){
    editingId = id;
    const overlay = document.getElementById('overlay');
    document.getElementById('modal-title').textContent = id ? 'Edit Menu Item' : 'Add Menu Item';

    if(id){
        const item = items.find(i => i.id === id);
        document.getElementById('f-name').value = item.name;
        document.getElementById('f-cat').value = item.category;
        document.getElementById('f-price').value = item.price;
        document.getElementById('f-desc').value = item.description;
    } else {
        document.getElementById('f-name').value = '';
        document.getElementById('f-cat').value = 'Starters';
        document.getElementById('f-price').value = '';
        document.getElementById('f-desc').value = '';
    }

    overlay.classList.add('open');
    document.getElementById('f-name').focus();
}
function closeModal(){
    document.getElementById('overlay').classList.remove('open');
    editingId = null;
}
function handleOverlayClick(e){
    if (e.target === e.currentTarget) closeModal();
}
// ── CRUD ─────────────────────────────────────
  async function saveItem() {
    const payload = {
      name: document.getElementById('f-name').value.trim(),
      category: document.getElementById('f-cat').value,
      price: parseFloat(document.getElementById('f-price').value) || 0,
      description: document.getElementById('f-desc').value.trim(),
    };
    if (!payload.name) { toast('Please enter a dish name.'); return; }
 
    if (editingId) {
      await fetch(`${API}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      toast('Item updated.');
    } else {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      toast('Item added to menu.');
    }
 
    closeModal();
    await loadMenu();
  }
 
  async function deleteItem(id) {
    if (!confirm('Remove this item from the menu?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    toast('Item removed.');
    await loadMenu();
  }
 
  // Toast
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2800);
  }
 
  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && document.getElementById('overlay').classList.contains('open')) saveItem();
  });
 
  loadMenu();
