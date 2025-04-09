"use client"

import React, { useLayoutEffect, useRef } from 'react'
import { Column, CellProps } from 'react-datasheet-grid'
import Select from 'react-select'

// Define the type for a choice in the select dropdown
type Choice = {
  label: string;
  value: string | number;
}

// Define options for the select column
type SelectOptions = {
  choices: Choice[];
  disabled?: boolean;
  placeholder?: string;
}

// Create the select component that will render inside the column
const SelectComponent = React.memo(
  ({
    active,
    rowData,
    setRowData,
    focus,
    stopEditing,
    columnData,
  }: CellProps<any, SelectOptions>) => {
    const ref = useRef<any>(null);

    // Use layout effect to focus/blur the select when the cell gains/loses focus
    useLayoutEffect(() => {
      if (focus) {
        ref.current?.focus();
      } else {
        ref.current?.blur();
      }
    }, [focus]);

    return (
      <Select
        ref={ref}
        styles={{
          container: (provided) => ({
            ...provided,
            flex: 1,
            alignSelf: 'stretch',
            pointerEvents: focus ? undefined : 'none',
          }),
          control: (provided) => ({
            ...provided,
            height: '100%',
            border: 'none',
            boxShadow: 'none',
            background: 'none',
          }),
          indicatorSeparator: (provided) => ({
            ...provided,
            opacity: 0,
          }),
          indicatorsContainer: (provided) => ({
            ...provided,
            opacity: active ? 1 : 0,
          }),
          placeholder: (provided) => ({
            ...provided,
            opacity: active ? 1 : 0,
          }),
          menu: (provided) => ({
            ...provided,
            zIndex: 1000,
          }),
        }}
        isDisabled={columnData.disabled}
        placeholder={columnData.placeholder || "Select..."}
        value={
          // Handle multiple possible data formats:
          // 1. If rowData is a number (project ID), find by value
          // 2. If rowData is a string (description), find by label
          // 3. Fall back to null if not found
          typeof rowData === 'number' 
            ? columnData.choices.find(({ value }) => value === rowData) 
            : columnData.choices.find(({ label }) => label === rowData) ?? null
        }
        menuPortalTarget={document.body}
        menuIsOpen={focus}
        onChange={(choice) => {
          if (choice === null) {
            setRowData('');
            setTimeout(() => stopEditing(), 0);
            return;
          }
          
          setRowData(choice.value);
          setTimeout(() => stopEditing(), 0);
        }}
        onMenuClose={() => stopEditing({ nextRow: false })}
        options={columnData.choices}
      />
    )
  }
);

// Factory function to create the select column
export const selectColumn = (
  options: SelectOptions
): Column<any, SelectOptions> => ({
  component: SelectComponent,
  columnData: options,
  disableKeys: true,
  keepFocus: true,
  disabled: options.disabled,
  deleteValue: () => null,
  copyValue: ({ rowData }) =>
    options.choices.find((choice) => choice.value === rowData)?.label ?? null,
  pasteValue: ({ value }) =>
    options.choices.find((choice) => choice.label === value)?.value ?? null,
});