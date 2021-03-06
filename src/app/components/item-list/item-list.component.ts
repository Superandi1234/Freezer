import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as moment from 'moment';
import { Compartment } from '../../models/compartment';
import { Item } from '../../models/item';
import { CompartmentService } from '../../services/compartment.service';
import { DialogService } from '../../services/dialog.service';
import { ItemService } from '../../services/item.service';
import { TitleService } from '../../services/title.service';

@Component({
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit {

  compartments: Compartment[];
  items: Item[];
  filteredItems: Item[];
  filterForm: FormGroup;

  editMode = false;

  showLoadingIndicator = false;

  constructor(
    private _dialogService: DialogService
    , private _compartmentService: CompartmentService
    , private _itemService: ItemService
    , formBuilder: FormBuilder
    , private _titleService: TitleService
  ) {
    this.filterForm = formBuilder.group({
      name: [null],
      compartmentKey: [null]
    });

    this.filterForm.valueChanges.subscribe(v => this.filter());
    this._titleService.set('Inhalte');
  }

  ngOnInit() {
    this._compartmentService.get().subscribe(c => this.compartments = c);

    this.showLoadingIndicator = true;

    this._itemService.get().subscribe(i => {
      this.items = this.filteredItems = i;

      this.showLoadingIndicator = false;
    });
  }

  onTap(item: Item) {
    this.editItem(item);
  }

  filter() {
    this.items.forEach(i => i.selected = false);

    const nameFilter: string = this.filterForm.get('name').value;
    const compartmentKeyFilter: string = this.filterForm.get('compartmentKey').value;

    this.filteredItems = this.items.filter(i => (!nameFilter || i.name.toUpperCase().indexOf(nameFilter.toUpperCase()) > -1)
                                             && ((!compartmentKeyFilter || i.compartmentKey === compartmentKeyFilter)));
  }

  getCompartment(key: string) {
    const result = this.compartments.filter(c => c.key === key);
    return result ? result[0] : null;
  }

  addItem() {
    this._dialogService.openAddNewItemDialog().afterClosed().subscribe(i => {

      if (i) {
        this._itemService.add({
          ...i,
          createdDate: moment().format('YYYY-MM-DD'),
          expiryDate: i.expiryDate ? moment(i.expiryDate).format('YYYY-MM-DD') : '' }
        );
      }
    });

  }

  editItem(item: Item) {
    this._dialogService.openEditItemDialog(item).afterClosed().subscribe(i => {
      if (i) {
        this._itemService.update({ ...i, expiryDate: i.expiryDate ? moment(i.expiryDate).format('YYYY-MM-DD') : '' });
      }
    });

  }

  removeItem(item: Item) {
    this._dialogService.openMessageDialog('Soll der Inhalt wirklich gelöscht werden?').afterClosed().subscribe(result => {
      if (result === true) {
        this._itemService.remove(item.key);
      }
    });
  }

  get hasSelected() {
    return this.filteredItems && this.filteredItems.filter(i => i.selected).length > 0;
  }

  get selectedItem() {
    return this.filteredItems.filter(i => i.selected)[0];
  }

  selectItem(item: Item) {
    this.filteredItems.forEach(i => i.selected = item.key === i.key ? !item.selected : false);
  }

  trackByKey(index, item) {
    return item.key;
  }

  getDateAddedStyle(date: string) {
    if (moment(date).add(200, 'days').isSameOrAfter(moment())) {
      return 'unexpired';
    } else {
      return 'expired';
    }
  }

  getDateExpirationStyle(date: string) {
    if (moment(date).add(30, 'days').isSameOrAfter(moment())) {
      return 'unexpired';
    } else {
      return 'expired';
    }
  }
}
