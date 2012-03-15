/*
		search jQuery plugin

author: Mike van Rossum

requires jQuery (1.4+)

this jQuery plugin sets up a javascript based filter on an input field.

It works on elements that all have the same structure (but different content).

first create an object:

	var settings = {
		container: '#templates', // selector for container that holds (nothing but) indexable items
		single: '.single', // selector for the indexable items
		singleStructure: [ // all text elems inside single you want indexed
			{
				elem: 'h3',
				score: 3 // score for template if elem contains the searched words
			},
			{ //etc..
				elem: '.content',
				score: 1
			}
		]
	}

	$(input).search(settings);
	
	//you can now filter by typing words in the input and hit spacebar
	
	//or filter like this
	$(input).search(['word1', 'word2']);
	//or like this
	$(input).search('word1 word2');
	
*/
;(function( $ ){

  $.fn.search = function( parameter ) {  
	
	// prepare paremeter	
	var 
		wordsParam = [],
		options,
		inited = false;
	
	if( typeof(parameter) === 'string' ) {
		wordsParam = parameter.split(' ');
	} else if( typeof(parameter) === 'array' ) {
		wordsParam = parameter;
	} else if ( typeof(parameter) === 'object' ) {
		options = parameter;
	}
	
    // define default settings
    var settings = $.extend({
		'container': '#templates',
		'single': '.single',
		'singleStructure': [
			{
				'elem': 'h3',
				'score': 3
			},
			{
				'elem': 'textarea',
				'score': 1
			}
		]
    }, options);
	
	// define all private methods and properties
	var 
		output,
		search = this,
		singleElems = [],
		templates = [],
		included = [],
		scoreBoard = [],
		container = $( settings.container ),
		singles = container.find( settings.single ),
		/*
					These are all internal (private) methods
		*/
		/*
			this function searches the DOM for all templates 
			and adds them to the templates array
		*/
		init = function() {
			
			var structure = settings.singleStructure;

			//put all the score multipliers in scoreboard and cache all elems
			for(var len = structure.length, i = 0; i < len; i++) {
				scoreBoard.push(structure[i].score);
				singleElems.push(structure[i].elem);
			}

			//take singles off dom, give them a start position, store the (to be indexed) text and re-attach to the dom
			singles.detach().each(function(i){

				$( this ).data( 'position', i );

				var temp = [];

				for( var len = singleElems.length, j = 0; j < len; j++ ) {
					temp.push( singles.eq( i ).find(singleElems[j]).text() );
				}

				templates.push({
					text: temp,
					score: 0
				});
			}).appendTo( container );

			//if an search input is provided, let's watch it.
			watchInput();
			
			inited = true;
			output = templates.length;
		},
		query = function( words ) {
			
			//reset the score and the results array
			clean();

			var 
				inArray = function( item, array ) {
					return $.inArray( item, array ) < 0;
				};

			// every word
			for( var lenI = words.length, i = 0; i < lenI; i++ ) {
				var	word = words[i];

				//in every template
				for( var lenJ = templates.length, j = 0; j < lenJ; j++ ) {

					var template = templates[j],
						filter = new RegExp( '\\b' + word + '\\b', 'gi' );


					// in every element of every template
					for( var lenK = singleElems.length, k = 0; k < lenK; k++ ) {

						if( filter.test(template.text[k]) ) {
							//the word is in the elem
							template.score += scoreBoard[k];

							//if it's a new word
							if( inArray(j, included) ){
								//it's not in the array yet
								included.push( j );
							}
						}
					}
				}
			}

			//remove low hits
			var treshold = words.length; //Math.floor((words.length + 1) / 2);

			build( treshold );
		},
		/*
			this funcion resets all scores to 0
		*/
		clean = function() {
			//reset score
			for( var len = templates.length, i = 0; i < len; i++ ) {
				templates[i].score = 0;
			}

		},
		/*
			this functions hides all singles that are either not in included or have a to low score
		*/
		build = function( treshold ) {
			console.log(singles);
			function scoreSort( a, b ) {
			    return $( a ).data( 'score' ) < $( b ).data( 'score' ) ? 1 : -1;
			}

			function positionSort( a, b ) {
			    return $( a ).data( 'position' ) > $( b ).data( 'position' ) ? 1 : -1;
			}
			output = 0;
			
			// take them off dom, manip and put them back
			// we need to sort because templates needs to be mapped to singles
			singles.detach().sort( positionSort ).each(function(i) {
				var $this = $( this );

				$this.hide().data( 'score', templates[i].score );

				// console.log('pos: ' + $this.data('position') + '\tscore: ' + $this.data('score') + '\t' + $this.find('h3').text())

				//if this template is not included or if this index number does not meet the treshold
				if( $.inArray(i, included) != -1 && treshold <= templates[i].score ) {
					$this.show();
					output++;
				}
			});

			singles.sort( scoreSort );
			container.append( singles );

			//we need to requery because we just changed them
			singles = container.find( settings.single );

		},
		/*
			this function watches an input field for 
			spacebars and filters upon
		*/
		watchInput = function() {
			search.keyup(function( e ) {

				//if input is empty display all results
				if( search.val() == '' ) {
					query([' ']);
					return;
				}

				if( e.which == 32 ) { // = spacebar
					var
						words = [],
						input = search.val().split(' ');

					for( var i = 0, len = input.length; i < len; i++ ) {
						if( input[i] != '' ) {
							words.push( input[i] );
						}
					}

					query( words );

				}
			});
		}, filter = function( words, input ) {
			query( words );

			//add query to input
			if( !input && words[0] != ' ' ) {//it's not a reset
				var string = words.join(' ') + ' ';
				search.val( string );
			}
		};
	
	// init if its the first time
	if( !inited ) {
		init();
	} 
	
	// filter if we searched for words
	if( wordsParam.length) {
		query( wordsParam );
	}
	
	// return output;

  };
})( jQuery );