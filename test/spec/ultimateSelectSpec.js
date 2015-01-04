// configure the fixtures path
jasmine.getFixtures().fixturesPath = 'fixtures';

describe("Single Select", function() {


    describe('Fixtures', function() {
        var $select;
        beforeEach(function () {
            loadFixtures('singleSelect.html');
            $select = $('.uSelect');
        });

        it("should add the element in the dom", function() {
            expect($select).toExist();
        });

        it("should add only one select in the dom", function() {
            expect($select.length).toBe(1);
        });

        it("should add only multiple select elements in the dom", function() {

            loadFixtures('multipleSelects.html');

            expect($('.uSelect').length).toBe(4);
        });

    });

    describe('Plugin loaded', function() {

        it('should have loaded the jquery plugin', function() {
            expect($.fn.ultimateSelect).toBeTruthy();
            expect(UltimateSelect).toBeDefined();
        });

    });

    describe('Initialization', function() {
        var $select;

        beforeEach(function () {
            loadFixtures('singleSelect.html');
            // call the plugin
            $select = $('.uSelect').ultimateSelect();
        });

        it('should hide the select element', function() {
            expect($select).not.toBeVisible();
        });

        it('should set data ultimateSelect-control', function() {
            var $control = $select.data('ultimateSelect-control');

            expect($control).toBeTruthy();
            expect($control).toEqual('.ultimateSelect');
        });

        it('should add the control in the dom', function() {
            var $control = $select.data('ultimateSelect-control');

            expect($control).toBeInDOM();
        });

    });


});
