import React, { useState, useCallback, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import bugsService from '../../../../../services/bugsService';
import ActionButton from '../../../../../components/ActionButton/ActionButton';
import ConfirmCloseDialog from '../../../../../components/ConfirmCloseDialog/ConfirmCloseDialog';
import { useModalEscapeKey } from '../../../../../hooks/useModalEscapeKey';
import './BugFormModal.scss';

const INITIAL_FORM = {
  titulo: '',
  descripcion: '',
  tipo: 'BUG',
  version: '',
};

function BugFormModal({ onClose, onSave }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const initialFormRef = useRef(JSON.stringify(INITIAL_FORM));

  const hasChanges = useMemo(() => {
    return JSON.stringify(form) !== initialFormRef.current;
  }, [form]);

  const handleEscapeWithChanges = useCallback(() => {
    if (hasChanges) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  useModalEscapeKey(true, hasChanges, onClose, handleEscapeWithChanges);

  const handleTituloChange = (e) => {
    setForm((prev) => ({ ...prev, titulo: e.target.value }));
  };

  const handleDescripcionChange = (value) => {
    setForm((prev) => ({ ...prev, descripcion: value }));
  };

  const handleTipoChange = (e) => {
    setForm((prev) => ({ ...prev, tipo: e.target.value }));
  };

  const handleVersionChange = (e) => {
    setForm((prev) => ({ ...prev, version: e.target.value }));
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmClose(false);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!form.descripcion || form.descripcion.trim() === '<p><br></p>' || !form.descripcion.replace(/<[^>]*>/g, '').trim()) {
      setError('La descripción es requerida');
      return;
    }

    setLoading(true);
    try {
      await bugsService.crear({
        titulo: form.titulo.trim() || null,
        descripcion: form.descripcion,
        tipo: form.tipo,
        version: form.version.trim() || null,
      });
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al reportar bug');
    } finally {
      setLoading(false);
    }
  };

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['image'],
    ],
  };

  return (
    <>
      <div className="bug-form-modal__overlay" onClick={handleEscapeWithChanges}>
        <div className="bug-form-modal" onClick={(e) => e.stopPropagation()}>
          <div className="bug-form-modal__header">
            <h3 className="bug-form-modal__title">Reportar Bug</h3>
            <button
              className="bug-form-modal__close"
              onClick={handleEscapeWithChanges}
              type="button"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="bug-form-modal__body">
            {error && <div className="bug-form-modal__error">{error}</div>}

            <div className="bug-form-modal__field">
              <label className="bug-form-modal__label">Título (opcional)</label>
              <input
                type="text"
                className="bug-form-modal__input"
                value={form.titulo}
                onChange={handleTituloChange}
                placeholder="Resumen breve del problema"
              />
            </div>

            <div className="bug-form-modal__fields-row">
              <div className="bug-form-modal__field">
                <label className="bug-form-modal__label">Tipo *</label>
                <select
                  className="bug-form-modal__select"
                  value={form.tipo}
                  onChange={handleTipoChange}
                >
                  <option value="BUG">Bug</option>
                  <option value="REQUERIMIENTO">Requerimiento</option>
                </select>
              </div>
              <div className="bug-form-modal__field">
                <label className="bug-form-modal__label">Versión (opcional)</label>
                <input
                  type="text"
                  className="bug-form-modal__input"
                  value={form.version}
                  onChange={handleVersionChange}
                  placeholder="ej: 1.0.6"
                />
              </div>
            </div>

            <div className="bug-form-modal__field bug-form-modal__field--full">
              <label className="bug-form-modal__label">Descripción *</label>
              <ReactQuill
                theme="snow"
                value={form.descripcion}
                onChange={handleDescripcionChange}
                modules={quillModules}
                placeholder="Describe el bug detalladamente. Puedes adjuntar imágenes."
                className="bug-form-modal__quill"
              />
            </div>
          </div>

          <div className="bug-form-modal__footer">
            <ActionButton
              variant="secondary"
              onClick={handleEscapeWithChanges}
              disabled={loading}
            >
              Cancelar
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={handleSubmit}
              disabled={loading || !form.descripcion.replace(/<[^>]*>/g, '').trim()}
            >
              {loading ? 'Enviando...' : 'Enviar Bug'}
            </ActionButton>
          </div>
        </div>
      </div>

      <ConfirmCloseDialog
        isOpen={showConfirmClose}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
      />
    </>
  );
}

export default BugFormModal;
