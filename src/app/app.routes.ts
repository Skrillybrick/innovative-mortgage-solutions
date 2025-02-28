import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoanOfficersComponent } from './loan-officers/loan-officers.component';
import { LoanApplicationComponent } from './loan-application/loan-application.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'loan-officers', component: LoanOfficersComponent },
  { path: 'loan-application', component: LoanApplicationComponent },
  { path: '**', redirectTo: '' }
];
