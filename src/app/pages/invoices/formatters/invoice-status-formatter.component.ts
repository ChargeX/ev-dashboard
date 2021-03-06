import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import { CellContentTemplateDirective } from 'app/shared/table/cell-content-template/cell-content-template.directive';
import { ChipType } from 'app/types/GlobalType';

import { BillingInvoice, BillingInvoiceStatus } from '../../../types/Billing';
import { invoicesStatuses } from '../model/invoices.model';

@Component({
  selector: 'app-invoice-status-formatter',
  template: `
    <mat-chip-list [selectable]="false">
      <mat-chip [ngClass]="row.status | appFormatInvoiceStatus:'class'" [disabled]="true">
        {{row.status | appFormatInvoiceStatus:'text' | translate}}
      </mat-chip>
    </mat-chip-list>
  `,
})
export class InvoiceStatusFormatterComponent extends CellContentTemplateDirective {
  @Input() public row!: BillingInvoice;
}

@Pipe({ name: 'appFormatInvoiceStatus' })
export class AppFormatInvoiceStatusPipe implements PipeTransform {
  public transform(invoiceStatus: BillingInvoiceStatus, type: string): string {
    if (type === 'class') {
      return this.buildInvoiceStatusClasses(invoiceStatus);
    }
    if (type === 'text') {
      return this.buildInvoiceStatusText(invoiceStatus);
    }
    return '';
  }

  public buildInvoiceStatusClasses(status: BillingInvoiceStatus): string {
    let classNames = 'chip-width-5em ';
    switch (status) {
      case BillingInvoiceStatus.PAID:
        classNames += ChipType.SUCCESS;
        break;
      case BillingInvoiceStatus.OPEN:
        classNames += ChipType.DANGER;
        break;
      default:
        classNames += ChipType.DEFAULT;
    }
    return classNames;
  }

  public buildInvoiceStatusText(status: string): string {
    for (const invoiceStatus of invoicesStatuses) {
      if (invoiceStatus.key === status) {
        return invoiceStatus.value;
      }
    }
    return '';
  }
}
