/// <reference types="cypress" />

context('Page load', () => {
  beforeEach(() => {
    cy.visit('/')
  })
  describe('React integration', () => {
    it('Should mount', () => {
      cy.get('#app')
        .should('exist', 'success')
    })
  })
})
