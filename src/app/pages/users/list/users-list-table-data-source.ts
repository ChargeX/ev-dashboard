import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TableCheckTransactionsAction } from 'app/pages/transactions/table-actions/table-check-transactions-action';
import { SpinnerService } from 'app/services/spinner.service';
import { WindowService } from 'app/services/window.service';
import { TableMoreAction } from 'app/shared/table/actions/table-more-action';
import { TableOpenURLActionDef } from 'app/shared/table/actions/table-open-url-action';
import { SiteTableFilter } from 'app/shared/table/filters/site-table-filter';
import { TagTableFilter } from 'app/shared/table/filters/tag-table-filter';
import { DataResult } from 'app/types/DataResult';
import { TableActionDef, TableColumnDef, TableDef, TableFilterDef } from 'app/types/Table';
import TenantComponents from 'app/types/TenantComponents';
import { TransactionButtonAction } from 'app/types/Transaction';
import { User, UserButtonAction, UserToken } from 'app/types/User';
import { Observable } from 'rxjs';

import { AuthorizationService } from '../../../services/authorization.service';
import { CentralServerNotificationService } from '../../../services/central-server-notification.service';
import { CentralServerService } from '../../../services/central-server.service';
import { ComponentService } from '../../../services/component.service';
import { DialogService } from '../../../services/dialog.service';
import { MessageService } from '../../../services/message.service';
import { AppDatePipe } from '../../../shared/formatters/app-date.pipe';
import { TableAutoRefreshAction } from '../../../shared/table/actions/table-auto-refresh-action';
import { TableRefreshAction } from '../../../shared/table/actions/table-refresh-action';
import { IssuerFilter } from '../../../shared/table/filters/issuer-filter';
import { TableDataSource } from '../../../shared/table/table-data-source';
import { BillingButtonAction } from '../../../types/Billing';
import ChangeNotification from '../../../types/ChangeNotification';
import { Utils } from '../../../utils/Utils';
import { UserRoleFilter } from '../filters/user-role-filter';
import { UserStatusFilter } from '../filters/user-status-filter';
import { AppUserRolePipe } from '../formatters/user-role.pipe';
import { UserStatusFormatterComponent } from '../formatters/user-status-formatter.component';
import { TableAssignSitesToUserAction, TableAssignSitesToUserActionDef } from '../table-actions/table-assign-sites-to-user-action';
import { TableCheckTagsAction } from '../table-actions/table-check-tags-action';
import { TableCreateUserAction, TableCreateUserActionDef } from '../table-actions/table-create-user-action';
import { TableDeleteUserAction, TableDeleteUserActionDef } from '../table-actions/table-delete-user-action';
import { TableEditUserAction, TableEditUserActionDef } from '../table-actions/table-edit-user-action';
import { TableExportUsersAction, TableExportUsersActionDef } from '../table-actions/table-export-users-action';
import { TableForceSyncBillingUserAction } from '../table-actions/table-force-sync-billing-user-action';
import { TableSyncBillingUsersAction } from '../table-actions/table-sync-billing-users-action';

@Injectable()
export class UsersListTableDataSource extends TableDataSource<User> {
  private editAction = new TableEditUserAction().getActionDef();
  private assignSitesToUser = new TableAssignSitesToUserAction().getActionDef();
  private deleteAction = new TableDeleteUserAction().getActionDef();
  private syncBillingUsersAction = new TableSyncBillingUsersAction().getActionDef();
  private forceSyncBillingUserAction = new TableForceSyncBillingUserAction().getActionDef();
  private checkTagsAction = new TableCheckTagsAction().getActionDef();
  private checkTransactionsAction = new TableCheckTransactionsAction().getActionDef();
  private currentUser: UserToken;

  constructor(
      public spinnerService: SpinnerService,
      public translateService: TranslateService,
      private messageService: MessageService,
      private dialogService: DialogService,
      private router: Router,
      private dialog: MatDialog,
      private centralServerNotificationService: CentralServerNotificationService,
      private centralServerService: CentralServerService,
      private authorizationService: AuthorizationService,
      private componentService: ComponentService,
      private appUserRolePipe: AppUserRolePipe,
    private datePipe: AppDatePipe,
    private windowService: WindowService) {
    super(spinnerService, translateService);
    // Init
    if (this.authorizationService.hasSitesAdminRights()) {
      this.setStaticFilters([{ SiteID: this.authorizationService.getSitesAdmin().join('|') }]);
    }
    this.initDataSource();
    this.initFilters();
    // Store the current user
    this.currentUser = this.centralServerService.getLoggedUser();
  }

  public initFilters() {
    // Tag
    const tagID = this.windowService.getSearch('TagID');
    if (tagID) {
      const tagTableFilter = this.tableFiltersDef.find(filter => filter.id === 'tag');
      if (tagTableFilter) {
        tagTableFilter.currentValue.push({
          key: tagID, value: tagID,
        });
        this.filterChanged(tagTableFilter);
      }
    }
  }

  public getDataChangeSubject(): Observable<ChangeNotification> {
    return this.centralServerNotificationService.getSubjectUsers();
  }

  public loadDataImpl(): Observable<DataResult<User>> {
    return new Observable((observer) => {
      // Get the Tenants
      this.centralServerService.getUsers(this.buildFilterValues(),
        this.getPaging(), this.getSorting()).subscribe((users) => {
        // Ok
        observer.next(users);
        observer.complete();
      }, (error) => {
        // Show error
        Utils.handleHttpError(error, this.router, this.messageService, this.centralServerService, 'general.error_backend');
        // Error
        observer.error(error);
      });
    });
  }

  public buildTableDef(): TableDef {
    return {
      search: {
        enabled: true,
      },
      hasDynamicRowAction: true,
    };
  }

  public buildTableColumnDefs(): TableColumnDef[] {
    const loggedUserRole = this.centralServerService.getLoggedUser().role;
    const columns = [];
    columns.push(
      {
        id: 'status',
        name: 'users.status',
        isAngularComponent: true,
        angularComponent: UserStatusFormatterComponent,
        headerClass: 'col-10em text-center',
        class: 'col-10em table-cell-angular-big-component',
        sortable: true,
      },
      {
        id: 'role',
        name: 'users.role',
        formatter: (role: string) => role ? this.translateService.instant(this.appUserRolePipe.transform(role, loggedUserRole)) : '-',
        headerClass: 'col-10em',
        class: 'text-left col-10em',
        sortable: true,
      },
      {
        id: 'name',
        name: 'users.name',
        headerClass: 'col-15p',
        class: 'text-left col-15p',
        sorted: true,
        direction: 'asc',
        sortable: true,
      },
      {
        id: 'firstName',
        name: 'users.first_name',
        headerClass: 'col-15p',
        class: 'text-left col-15p',
        sortable: true,
      },
      {
        id: 'email',
        name: 'users.email',
        headerClass: 'col-20p',
        class: 'text-left col-20p',
        sortable: true,
      },
    );
    if (this.componentService.isActive(TenantComponents.BILLING)) {
      columns.push(
        {
          id: 'billingData.customerID',
          name: 'billing.id',
          headerClass: 'col-15p',
          class: 'col-15p',
          sortable: true,
        },
        {
          id: 'billingData.lastChangedOn',
          name: 'billing.updated_on',
          headerClass: 'col-15p',
          formatter: (lastChangedOn: Date) => this.datePipe.transform(lastChangedOn),
          class: 'col-15p',
          sortable: true,
        },
      );
    }
    columns.push(
      {
        id: 'createdOn',
        name: 'users.created_on',
        formatter: (createdOn: Date) => this.datePipe.transform(createdOn),
        headerClass: 'col-15em',
        class: 'col-15em',
        sortable: true,
      },
      {
        id: 'createdBy',
        name: 'users.created_by',
        headerClass: 'col-15em',
        class: 'col-15em',
      },
      {
        id: 'lastChangedOn',
        name: 'users.changed_on',
        formatter: (lastChangedOn: Date) => this.datePipe.transform(lastChangedOn),
        headerClass: 'col-15em',
        class: 'col-15em',
        sortable: true,
      },
      {
        id: 'lastChangedBy',
        name: 'users.changed_by',
        headerClass: 'col-15em',
        class: 'col-15em',
      },
      {
        id: 'eulaAcceptedOn',
        name: 'users.eula_accepted_on',
        formatter: (eulaAcceptedOn: Date, row: User) => {
          return eulaAcceptedOn ? this.datePipe.transform(eulaAcceptedOn) + ` (${this.translateService.instant('general.version')} ${row.eulaAcceptedVersion})` : '-';
        },
        headerClass: 'col-20em',
        class: 'col-20em',
        sortable: true,
      },
    );
    return columns as TableColumnDef[];
  }

  public buildTableActionsDef(): TableActionDef[] {
    const tableActionsDef = super.buildTableActionsDef();
    tableActionsDef.unshift(new TableExportUsersAction().getActionDef());
    tableActionsDef.unshift(new TableCreateUserAction().getActionDef());
    if (this.componentService.isActive(TenantComponents.BILLING) &&
        this.authorizationService.canSynchronizeBillingUsers()) {
      tableActionsDef.splice(1, 0, this.syncBillingUsersAction);
    }
    return [
      ...tableActionsDef,
    ];
  }

  public buildTableDynamicRowActions(user: User): TableActionDef[] {
    let actions;
    if (this.componentService.isActive(TenantComponents.ORGANIZATION) &&
        this.authorizationService.canUpdateUser() &&
        this.authorizationService.canUpdateSite()) {
      actions = [
        this.editAction,
        this.assignSitesToUser,
      ];
    } else {
      actions = [
        this.editAction,
      ];
    }
    const moreActions = new TableMoreAction([]);
    if (this.componentService.isActive(TenantComponents.BILLING) &&
        this.authorizationService.canSynchronizeBillingUser()) {
      moreActions.addActionInMoreActions(this.forceSyncBillingUserAction);
    }
    if (this.currentUser.id !== user.id && this.authorizationService.canDeleteUser()) {
      moreActions.addActionInMoreActions(this.deleteAction);
    }
    moreActions.addActionInMoreActions(this.checkTagsAction);
    moreActions.addActionInMoreActions(this.checkTransactionsAction);
    actions.push(moreActions.getActionDef());
    return actions;
  }

  public actionTriggered(actionDef: TableActionDef) {
    // Action
    switch (actionDef.id) {
      case UserButtonAction.CREATE_USER:
        if (actionDef.action) {
          (actionDef as TableCreateUserActionDef).action(this.dialog, this.refreshData.bind(this));
        }
        break;
      case UserButtonAction.EXPORT_USERS:
        if (actionDef.action) {
          (actionDef as TableExportUsersActionDef).action(this.buildFilterValues(), this.dialogService,
            this.translateService, this.messageService, this.centralServerService, this.router,
            this.spinnerService);
        }
        break;
      case BillingButtonAction.SYNCHRONIZE_BILLING_USERS:
        if (this.syncBillingUsersAction.action) {
          this.syncBillingUsersAction.action(
            this.dialogService, this.translateService, this.messageService,
            this.centralServerService, this.router,
          );
        }
        break;
    }
  }

  public rowActionTriggered(actionDef: TableActionDef, user: User) {
    switch (actionDef.id) {
      case UserButtonAction.EDIT_USER:
        if (actionDef.action) {
          (actionDef as TableEditUserActionDef).action(user, this.dialog, this.refreshData.bind(this));
        }
        break;
      case UserButtonAction.ASSIGN_SITES_TO_USER:
        if (actionDef.action) {
          (actionDef as TableAssignSitesToUserActionDef).action(user, this.dialog, this.refreshData.bind(this));
        }
        break;
      case UserButtonAction.DELETE_USER:
        if (actionDef.action) {
          (actionDef as TableDeleteUserActionDef).action(
            user, this.dialogService, this.translateService, this.messageService,
            this.centralServerService, this.spinnerService, this.router, this.refreshData.bind(this));
        }
        break;
      case UserButtonAction.BILLING_FORCE_SYNCHRONIZE_USER:
        if (this.forceSyncBillingUserAction.action) {
          this.forceSyncBillingUserAction.action(
            user, this.dialogService, this.translateService, this.spinnerService,
            this.messageService, this.centralServerService, this.router,
            this.refreshData.bind(this)
          );
        }
        break;
      case UserButtonAction.CHECK_TAGS:
        if (actionDef.action) {
          (actionDef as TableOpenURLActionDef).action('users#tag?UserID=' + user.id);
        }
        break;
      case TransactionButtonAction.CHECK_TRANSACTIONS:
        if (actionDef.action) {
          (actionDef as TableOpenURLActionDef).action('transactions#history?UserID=' + user.id);
        }
        break;
    }
  }

  public buildTableActionsRightDef(): TableActionDef[] {
    return [
      new TableAutoRefreshAction(false).getActionDef(),
      new TableRefreshAction().getActionDef(),
    ];
  }

  public buildTableFiltersDef(): TableFilterDef[] {
    return [
      new IssuerFilter().getFilterDef(),
      new UserRoleFilter(this.centralServerService).getFilterDef(),
      new UserStatusFilter().getFilterDef(),
      new TagTableFilter().getFilterDef(),
      new SiteTableFilter().getFilterDef(),
    ];
  }
}
