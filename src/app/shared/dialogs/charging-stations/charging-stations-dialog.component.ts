import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChargingStation } from 'app/types/ChargingStation';
import { KeyValue } from 'app/types/GlobalType';

import { DialogTableDataComponent } from '../dialog-table-data.component';
import { ChargingStationsDialogTableDataSource } from './charging-stations-dialog-table-data-source';

@Component({
  templateUrl: '../dialog-table-data.component.html',
})
export class ChargingStationsDialogComponent extends DialogTableDataComponent<ChargingStation> {
  constructor(
    private chargingStationsDataSource: ChargingStationsDialogTableDataSource,
    dialogRef: MatDialogRef<ChargingStationsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: any) {
    // Super class
    super(data, dialogRef, chargingStationsDataSource);
    // Default title
    if (this.title === '') {
      this.title = 'chargers.select_chargers';
    }
    this.chargingStationsDataSource.destroyDatasource();
  }

  public getSelectedItems(selectedRows: ChargingStation[]): KeyValue[] {
    const items = [];
    if (selectedRows && selectedRows.length > 0) {
      selectedRows.forEach((row) => {
        items.push({ key: row.id, value: row.id, objectRef: row });
      });
    }
    return items;
  }
}
