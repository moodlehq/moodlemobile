/**
 * Matcher that checks to see if the actual, a Jasmine spy, was called with a
 * set of parameters for each expected call.
 *
 * @augments jasmine.Matchers
 * @example toHaveBeenCalledSequentiallyWith(
 *     [
 *         [CallOneArgOne, CallOneArgTwo],
 *         [CallTwoArgOne, CallTwoArgTwo],
 *         ...
 *     ]
 * )
 * @return bool TRUE if the match succeeded, FALSE otherwise.
 */
jasmine.Matchers.prototype.toHaveBeenCalledSequentiallyWith = function() {
    var actualArgs = this.actual.argsForCall;
    var expectedArgs = jasmine.util.argsToArray(arguments);
    expectedArgs = expectedArgs[0];

    if (!jasmine.isSpy(this.actual)) {
        throw new Error('Expected a spy, but got ' + jasmine.pp(this.actual) + '.');
    }

    var response = true;
    var positiveMessage = "";
    if (actualArgs.length < expectedArgs.length) {
        // Function not called sufficient times
        positiveMessage = "Expected spy " + this.actual.identity;
        positiveMessage += " to have been called " + expectedArgs.length;
        positiveMessage += " times but it was only called " + actualArgs.length + " times.";
        response = false;
    } else if (actualArgs.length > expectedArgs.length) {
        // Function called more times than expected
        positiveMessage = "Expected spy " + this.actual.identity;
        positiveMessage += " to have been called " + expectedArgs.length;
        positiveMessage += " time but it was actually called " + actualArgs.length + " times.";
        response = false;
    } else {
        // For each actual arguments used in the function
        for (var i = 0, length = actualArgs.length; i < length; i++) {
            // And each expected argument
            for (var j = 0, expectedLength = expectedArgs.length; j < expectedLength; j++) {
                // If the actual argument isn't *exactly* what's expected
                // then set response to FALSE, and break out of the loop.
                // Sets the positive message to say which argument was wrong.
                if (typeof(actualArgs[i][j]) === typeof(expectedArgs)) {
                    if (typeof(actualArgs) == 'function') {
                        continue;
                    } else if (typeof(actualArgs[i][j]) == 'object' && typeof(expectedArgs[i][j]) == 'object') {
                        if (JSON.stringify(actualArgs[i][j]) != JSON.stringify(expectedArgs[i][j])) {
                            response = response && false;
                            positiveMessage = "Expected argument set " + i + " part " + j;
                            positiveMessage += " to be object: " + JSON.stringify(actualArgs[i][j]);
                            positiveMessage += " but got: " + JSON.stringify(expectedArgs[i][j]);
                        }
                    } else if (actualArgs[i][j] !== expectedArgs[i][j]) {
                        response = response && false;
                        positiveMessage = "Expected argument set " + i + " part " + j;
                        positiveMessage += " to be " + expectedArgs[i][j];
                        positiveMessage += " but got: " + actualArgs[i][j];
                        break;
                    }
                }
            }

            // If we've had a negative response at this point then break again.
            if (response === false) {
                break;
            }
        }
    }

    this.message = function() {
        var invertedMessage = "Expected spy " + this.actual.identity +
            " not to have been called with " + jasmine.pp(expectedArgs) +
            " but it was.";

        if (this.actual.callCount === 0) {
            positiveMessage = "Expected spy " + this.actual.identity;
            positiveMessage += " to have been called with " + jasmine.pp(expectedArgs);
            positiveMessage += " but it was never called.";
        }

        return [positiveMessage, invertedMessage];
    };

    return response;
};