const { expect } = require('chai');
const formatters = require('../lib/formatters');

describe('formatters', () => {
    it('parse empty', () => {
        const res = formatters.parseInt(undefined, 101)
        expect(res).to.eql(101)
    })
    it('parse number', () => {
        const res = formatters.parseInt(102, 101)
        expect(res).to.eql(102)
    })
    it('parse error', () => {
        const res = formatters.parseInt('foo', 101)
        expect(res).to.eql(101)
    })
})