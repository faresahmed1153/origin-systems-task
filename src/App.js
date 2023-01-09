import React, { useCallback, useMemo, useState, useEffect } from "react";
import MaterialReactTable from "material-react-table";
import { Box, IconButton, Tooltip, Button } from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import axios from "axios";
import Joi from "joi";
import { ExportToCsv } from "export-to-csv";
const App = () => {
  useEffect(() => {
    getData();
  }, []);
  const [tableData, setTableData] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const getData = async () => {
    const response = await axios.get("https://random-data-api.com/api/v2/appliances?size=30");
    if (response.status === 200) {
      setTableData(response.data);
    } else {
      setTableData([]);
    }
  };
  const handleExportData = () => {
    const csvOptions = {
      fieldSeparator: ",",
      quoteStrings: '"',
      decimalSeparator: ".",
      showLabels: true,
      useBom: true,
      useKeysAsHeaders: false,
      headers: columns.map((c) => c.header),
    };
    const csvExporter = new ExportToCsv(csvOptions);
    csvExporter.generateCsv(tableData);
  };
  const handleSaveRowEdits = async ({ exitEditingMode, row, values }) => {
    if (!Object.keys(validationErrors).length) {
      tableData[row.index] = values;
      setTableData([...tableData]);
      exitEditingMode();
    }
  };

  const handleCancelRowEdits = () => {
    setValidationErrors({});
  };

  const handleDeleteRow = useCallback(
    (row) => {
      // eslint-disable-next-line no-restricted-globals
      if (!window.confirm(`Are you sure you want to delete ${row.getValue("equipment")}`)) {
        return;
      }

      tableData.splice(row.index, 1);
      setTableData([...tableData]);
    },
    [tableData]
  );
  const validateRequired = (value) => {
    const schema = Joi.string().required();
    return schema.validate(value, { abortEarly: false });
  };

  const getCommonEditTextFieldProps = useCallback(
    (cell) => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event) => {
          const result = validateRequired(event.target.value);
          console.log(result);
          if (result.error) {
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is required`,
            });
          } else {
            delete validationErrors[cell.id];
            setValidationErrors({
              ...validationErrors,
            });
          }
        },
      };
    },
    [validationErrors]
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        enableColumnOrdering: false,
        enableEditing: false,
      },
      {
        accessorKey: "uid",
        header: "UID",
        enableColumnOrdering: false,
        enableEditing: false,
        enableSorting: false,
      },
      {
        accessorKey: "brand",
        header: "Brand",
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: "equipment",
        header: "Equipment",
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
    ],
    [getCommonEditTextFieldProps]
  );

  return (
    <>
      <MaterialReactTable
        displayColumnDefOptions={{
          "mrt-row-actions": {
            muiTableHeadCellProps: {
              align: "center",
            },
            size: 120,
          },
        }}
        columns={columns}
        data={tableData}
        initialState={{
          density: "comfortable",
          expanded: true,
          pagination: { pageIndex: 0, pageSize: 10 },
        }}
        editingMode="modal"
        enableGrouping
        enableEditing
        onEditingRowSave={handleSaveRowEdits}
        onEditingRowCancel={handleCancelRowEdits}
        enableDensityToggle={false}
        muiTablePaginationProps={{
          rowsPerPageOptions: [5, 10, 20],
        }}
        renderTopToolbarCustomActions={() => (
          <Box sx={{ display: "flex", gap: "1rem", p: "0.5rem", flexWrap: "wrap" }}>
            <Button color="primary" onClick={handleExportData} startIcon={<FileDownloadIcon />} variant="contained">
              Export Data
            </Button>
          </Box>
        )}
        renderRowActions={({ row, table }) => (
          <Box sx={{ display: "flex", gap: "1rem" }}>
            <Tooltip arrow placement="left" title="Edit">
              <IconButton onClick={() => table.setEditingRow(row)}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip arrow placement="right" title="Delete">
              <IconButton color="error" onClick={() => handleDeleteRow(row)}>
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      />
    </>
  );
};

export default App;
