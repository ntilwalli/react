/// <reference types="cypress" />

const { watchFile } = require("fs")

context('Page load', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.wait(500)
  })
  describe('React integration', () => {

    it('Should mount', () => {
      cy.get('#app')
        .should('exist', 'success')
    })
    it('Should have foo property on button', () => {
      cy.get('.clicker')
        // .its('foo')
        // .should('eq', 3)
        .then(($el) => {
          cy.wrap($el[0].foo).should('eq', 3)
        })
    })
    it('Should allow toggling className items based on domClass prop', () => {
      cy.get('.clicker')
        .then(($el) => {
          cy.wrap($el[0].className).should('eq', 'clicker hello')
        })
    })
  })
})
