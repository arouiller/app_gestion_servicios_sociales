# Fase 2 Testing Checklist

**Branch:** V_1.0.7  
**Commits:** 8b785a3 → bae74fa  
**Date:** 2026-05-15

## Testing Environment

⚠️ **Local testing not possible** — No Node.js in development environment.  
Test on: Hostinger server or external Node.js environment.

```bash
npm start  # Run from frontend/ directory
# Navigate to Planes section in browser
```

---

## BACKLOG-072: Búsqueda limitada a apellido

### Test 1.1: Search by holder surname
- [ ] Type "García" → Shows ONLY rows where plan holder's apellido contains "García"
- [ ] Clear search → All rows return
- [ ] Type "rouillo" → Shows rows with that partial match

### Test 1.2: Search isolation (negative tests)
- [ ] Type plan "numero_afiliado" (e.g., "001") → Should NOT filter (removed from search)
- [ ] Type "cobrador" name → Should NOT filter (removed from search)
- [ ] Type "plan-type" name → Should NOT filter (removed from search)
- [ ] Type "obra social" name → Should NOT filter (removed from search)

### Test 1.3: Search reset
- [ ] Clear search box → All rows return
- [ ] Click on a column header to sort → Search field retains text, results are re-sorted but still filtered

### Test 1.4: Placeholder update
- [ ] Search box placeholder reads: "Buscar por apellido del titular..." (was longer before)

---

## BACKLOG-073: Navegación por teclado

### Test 2.1: Active row visual (prerequisite)
- [ ] First row is visually highlighted with:
  - Light primary background
  - 4px left border in primary color
  - Box shadow inset border
- [ ] Highlight persists as you navigate

### Test 2.2: Arrow key navigation (single row)
- [ ] Click on table to focus
- [ ] Press ↓ arrow 3 times → Active row moves down 3 rows
- [ ] Press ↑ arrow 2 times → Active row moves up 2 rows
- [ ] Press ↑ at first row → Stays at first row (no wrapping)
- [ ] Press ↓ at last row on page → Stays at last row (no wrapping)

### Test 2.3: Page Up/Down navigation (10 rows)
- [ ] Load Planes page with 30+ items visible
- [ ] Navigate to first row (press ↑ multiple times)
- [ ] Press Page Down → Active row jumps ~10 rows down
- [ ] Press Page Down again → Jumps another ~10 rows
- [ ] Press Page Up → Jumps back ~10 rows
- [ ] At last row, press Page Down → Stays at last row

### Test 2.4: Auto-pagination
- [ ] Load Planes with pagination (more items than configItemsPerPage)
- [ ] Navigate ↓ repeatedly from current page's last row
- [ ] Page automatically increments as you navigate past it
- [ ] Navigate ↑ repeatedly from first row of page
- [ ] Page automatically decrements as you navigate before it

### Test 2.5: ALT+G hotkey (edit shortcut)
- [ ] Click on table to focus
- [ ] Navigate to any row using ↑/↓
- [ ] Press ALT+G
- [ ] Edit modal opens with that row's plan data
- [ ] Cancel modal → Return to table with same row still active/highlighted
- [ ] Save modal → Plan updates, return to table with same row still active

### Test 2.6: Active row reset on filter/sort/pagination changes
- [ ] Navigate to row #5 (visually count: 5th row on page)
- [ ] Type surname in search → Active row resets to first filtered result
- [ ] Clear search → Active row resets to first row of full list
- [ ] Click column header to sort → Active row resets to first row
- [ ] Change pagination limit (if available) → Active row resets to first

### Test 2.7: Delete interaction
- [ ] Navigate to a row using ↑/↓
- [ ] Click delete icon on active row (NOT the ALT+G edit)
- [ ] Delete modal appears
- [ ] Cancel → Active row remains highlighted
- [ ] Or complete delete → Active row resets or moves to next available row appropriately

### Test 2.8: Modal open prevents navigation
- [ ] Open any modal (e.g., edit, create)
- [ ] Press arrow keys → No navigation occurs (keyboard listener respects modalMode check)
- [ ] Close modal → Navigation works again

---

## Console Checks

- [ ] No JavaScript errors in DevTools console
- [ ] No warnings about missing keys or component issues
- [ ] Keyboard event handler logs (if any debug logs exist) behave correctly

---

## Edge Cases

### Test 3.1: Empty results
- [ ] Search for non-existent surname (e.g., "zzzzzz") → No results, no active row
- [ ] Search returns 0 items → Keyboard handler gracefully ignores (returns early)

### Test 3.2: Single row
- [ ] Filter results to show only 1 row
- [ ] Press ↑/↓ → Active row stays at the single row (no errors)
- [ ] ALT+G opens modal for that row

### Test 3.3: Pagination boundaries
- [ ] Configure items_per_page = 5
- [ ] Load planes with 20+ rows
- [ ] Navigate from page 1 row 5 ↓ → Page increments to 2, active row continues at page 2 row 1
- [ ] Navigate from page 2 row 1 ↑ → Page decrements to 1, active row continues at page 1 row 5

---

## Sign-Off

**Tester:** ___________________  
**Date:** ___________________  
**All tests passed:** [ ] Yes [ ] No

**Issues found:** (List any bugs discovered)

---

## Notes

- Keyboard listener attached globally to `window` (not table element)
- If table doesn't respond to keyboard, ensure table or a child element has focus
- Active row persists across sort/filter changes (resets to first row, but mechanism works)
- No backend changes required — all logic client-side
