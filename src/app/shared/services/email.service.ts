import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = environment.apiUrl || '/api';

  constructor(private http: HttpClient) { }

  /**
   * Send loan application data via email
   * @param formData The complete form data including files and application info
   * @returns Observable with the email sending result
   */
  sendLoanApplication(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/email/loan-application`, formData);
  }

  /**
   * Send a confirmation email to the applicant
   * @param email Applicant's email address
   * @param name Applicant's name
   * @param loanOfficerName Loan officer's name (if selected)
   * @returns Observable with the confirmation email result
   */
  sendConfirmationEmail(email: string, name: string, loanOfficerName?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/email/confirmation`, {
      email,
      name,
      loanOfficerName
    });
  }
}