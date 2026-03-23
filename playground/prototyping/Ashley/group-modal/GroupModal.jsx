/**
 * GroupModal (Prototype)
 *
 * Modal for adding/editing a Group from Group Admin → GroupInfoPage.
 * Figma: node-id=258-263800 (GroupInfoPage context)
 * Reference pattern: TutorModal (node-id=258-262330)
 */

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form } from 'react-bootstrap';

import Button from '@/components/Button/Button';
import Input from '@/forms/Input';
import Select from '@/forms/Select';
import NumberInput from '@/forms/NumberInput';

import './GroupModal.scss';

const GroupModal = ({
  show = false,
  mode = 'edit', // 'edit' | 'add'
  group,
  schools = [],
  tutors = [],
  onHide,
  onSave,
  onDelete,
  className = '',
  ...props
}) => {
  const schoolOptions = useMemo(
    () =>
      schools.map((s) => ({
        value: s.id,
        label: s.name,
      })),
    [schools]
  );

  const tutorOptions = useMemo(
    () =>
      tutors.map((t) => ({
        value: t.id,
        label: t.name,
      })),
    [tutors]
  );

  const [formData, setFormData] = useState({
    name: '',
    schoolId: '',
    tutorIds: [],
    size: '',
  });

  useEffect(() => {
    if (!show) return;

    const isEdit = mode === 'edit';
    const next = {
      name: isEdit ? group?.name || '' : '',
      schoolId: isEdit ? group?.schoolId || '' : '',
      tutorIds: isEdit ? group?.tutorIds || [] : [],
      size: isEdit ? (group?.size ?? '') : '',
    };
    setFormData(next);
  }, [show, mode, group]);

  const title = mode === 'add' ? 'Add a new group:' : (group?.name || 'Group');

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      className={`group-modal group-modal--${mode} ${className}`}
      {...props}
    >
      <div className="group-modal__container">
        <div className="group-modal__header">
          <h4 className="h4 group-modal__title">{title}</h4>
          <button
            type="button"
            className="group-modal__close"
            onClick={onHide}
            aria-label="Close"
          >
            <i className="fas fa-xmark" />
          </button>
        </div>

        <div className="group-modal__body">
          <Form>
            <div className="group-modal__form-group">
              <Input
                label="Group name"
                required
                type="text"
                placeholder="Ex. Math Masters"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                size="small"
              />
            </div>

            <Form.Group className="group-modal__form-group">
              <Form.Label className="body3-txt">School</Form.Label>
              <Select
                placeholder="Select a school"
                options={schoolOptions}
                value={formData.schoolId}
                onChange={(val) => setFormData((prev) => ({ ...prev, schoolId: val }))}
                size="small"
                searchable
                style={{ width: '100%' }}
              />
            </Form.Group>

            <Form.Group className="group-modal__form-group">
              <Form.Label className="body3-txt">Tutors</Form.Label>
              <Select
                mode="multi"
                placeholder="Select tutors"
                options={tutorOptions}
                value={formData.tutorIds}
                onChange={(vals) => setFormData((prev) => ({ ...prev, tutorIds: vals }))}
                size="small"
                searchable
                displayMode="badges"
                style={{ width: '100%' }}
              />
              <div className="group-modal__helper body3-txt">
                {formData.tutorIds.length} selected
              </div>
            </Form.Group>

            <div className="group-modal__form-group">
              <NumberInput
                label="Size"
                placeholder="Ex. 4"
                value={formData.size}
                size="small"
                min={1}
                onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
              />
            </div>
          </Form>
        </div>

        <div className="group-modal__footer">
          {mode === 'edit' ? (
            <Button
              text="Delete This Group"
              style="danger"
              fill="text"
              size="medium"
              onClick={onDelete}
            />
          ) : (
            <div />
          )}

          <div className="group-modal__actions">
            <Button
              text="Cancel"
              style="secondary"
              fill="text"
              size="medium"
              onClick={onHide}
            />
            <Button
              text="Save"
              style="primary"
              fill="filled"
              size="medium"
              onClick={() => onSave && onSave(formData)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

GroupModal.propTypes = {
  show: PropTypes.bool,
  mode: PropTypes.oneOf(['edit', 'add']),
  group: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    schoolId: PropTypes.string,
    tutorIds: PropTypes.arrayOf(PropTypes.string),
    size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  schools: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  tutors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  onHide: PropTypes.func,
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
  className: PropTypes.string,
};

export default GroupModal;

